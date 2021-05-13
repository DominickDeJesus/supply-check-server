require("dotenv").config();
const puppeteer = require("puppeteer");

class SupplyChecker {
	constructor(url, name) {
		this.name = name;
		this.finishedInit = false;
		this.status = "uninitialized";
		this.url = url.toLocaleLowerCase();
		this.lastMessageDate = null;
		this.lastScreenPath = null;
		this.tag = null;
		this.positiveString = null;
		this.browserOption =
			process.platform === "linux"
				? {
						args: ["--no-sandbox", "--disable-setuid-sandbox"],
						executablePath: "chromium-browser",
				  }
				: null;
	}

	async init() {
		if (this.status !== "uninitialized") return;
		this.print("info", "Initializing browser");

		const hostName = this.getHostName(this.url);
		this.setupForWebsite(hostName);
		this.browser = await puppeteer.launch({
			headless: true,
			...this.browserOption,
		});

		this.page = await this.browser.newPage();
		this.page.setUserAgent(
			`Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36`
		);
		await this.page.setDefaultNavigationTimeout(0);
		await this.page.setRequestInterception(true);

		this.page.on("request", (req) => {
			if (
				req.resourceType() == "stylesheet" ||
				req.resourceType() == "font" ||
				req.resourceType() == "image"
			) {
				req.abort();
			} else {
				req.continue();
			}
		});

		await this.page.goto(this.url, {
			waitUntil: "load",
		});
		this.finishedInit = true;
		this.status = "initialized";
		this.print("info", "Finished initializing");
		this.checkStock();
	}

	async checkStock() {
		try {
			if (!this.finishedInit)
				throw new Error("SupplyChecker has not been initialized!");
			this.status = "loading";
			this.print("info", "checking stock");
			await this.page.reload({
				waitUntil: "load",
			});
			this.print("info", "reloaded");
			await this.page.waitForSelector(this.tag);

			if (
				(await this.isInStock(this.page, this.tag)) &&
				!this.isToday(this.lastMessageDate)
			) {
				await this.screenshot();
				await this.sendTextNotification(this.url);
				this.status = "waiting";
				return true;
			}
			this.status = "waiting";
			return false;
		} catch (error) {
			this.print("error", this.name, error);
		}
	}

	async isInStock(page, tag) {
		if (!this.finishedInit)
			throw new Error("SupplyChecker has not been initialized!");
		const $ = require("cheerio");
		try {
			this.print("info", "Loading page content");
			const html = await page.content();
			const buttonText = $(tag, html).text().trim().toLocaleLowerCase();

			if (buttonText.includes(this.negativeString)) {
				this.print("info", `Out of stock! Tag content: ${buttonText}`);
				return false;
			} else if (buttonText.includes(this.positiveString)) {
				this.print("instock", `In stock!!! Tag content: ${buttonText}`);
				return true;
			} else {
				this.screenshot();
				this.print(
					"info",
					"Button content unknown! Tag html content: ",
					`${$(tag, html).html()}`
				);
				return false;
			}
		} catch (error) {
			this.print("error", this.name, error);
			return false;
		}
	}

	async changeUrl(url) {
		try {
			this.status = "changing";
			this.url = url.toLocaleLowerCase();
			this.lastMessageDate = null;
			const host = this.getHostName(this.url);
			this.setupForWebsite(host);
			await this.page.goto(this.url, {
				waitUntil: "load",
			});

			this.print("info", "Changed the url to " + url);
			await this.checkStock();
		} catch (error) {
			this.print("error", error);
			throw new Error("Cant change the url!");
		}
	}

	async screenshot() {
		if (!this.finishedInit)
			throw new Error("SupplyChecker has not been initialized!");
		const cloudinary = require("cloudinary").v2;
		this.lastMessageDate = new Date();
		const tempPath = `./screenshot.png`;
		const element = await this.page.$(this.tag);
		await element.screenshot({ path: tempPath });
		const response = await cloudinary.uploader.upload(tempPath);
		this.lastScreenPath = response.secure_url;
	}

	async sendTextNotification(url) {
		if (!this.finishedInit)
			throw new Error("SupplyChecker has not been initialized!");
		this.status = "texting";
		try {
			const client = require("twilio")(
				process.env.TWILIO_ACCOUNT_SID,
				process.env.TWILIO_AUTH_TOKEN
			);

			const message = await client.messages.create({
				body: `In stock alert!!! \n\n${url}`,
				from: process.env.TWILIO_PHONE_NUM,
				mediaUrl: this.lastScreenPath,
				to: process.env.TO_PHONE_NUM,
			});

			this.print("info", "Message sent! ", message.sid);
		} catch (error) {
			this.print(
				"error",
				"Something went wrong, message was not sent\n",
				error
			);
		}
	}

	setupForWebsite(website) {
		switch (website) {
			case "amazon.com":
				this.tag = `#availability span`;
				this.positiveString = "in stock.";
				this.negativeString =
					"we don't know when or if this item will be back in stock.";
				break;
			case "bestbuy.com":
				this.tag = `button[data-sku-id="${this.url.split("skuid=")[1]}"]`;
				this.positiveString = "add";
				this.negativeString = "sold out";
				break;
			case "walmart.com":
				//TODO: test these values thoroughly
				this.tag = `.spin-button-children`;
				this.positiveString = "add to cart";
				this.negativeString = "get in-stock alert.";
				break;
			case "newegg.com":
				//TODO: test these values thoroughly
				this.tag = `.product-inventory strong`;
				this.positiveString = "in stock.";
				this.negativeString = "out of stock.";
				break;
			case "gamestop.com":
				//TODO: test these values thoroughly
				this.tag = `.add-to-cart`;
				this.positiveString = "add to cart";
				this.negativeString = "not available";
				break;
			default:
				throw Error("This website is not supported!");
		}
	}

	getHostName(url) {
		const match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
		if (
			match != null &&
			match.length > 2 &&
			typeof match[2] === "string" &&
			match[2].length > 0
		) {
			return match[2];
		} else {
			return null;
		}
	}

	getTimestamp() {
		return (
			"[" +
			new Date().toLocaleString("en-US", { timeZone: "America/New_York" }) +
			"]"
		);
	}
	print(alert, ...message) {
		const time = this.getTimestamp();
		let style;
		switch (alert) {
			case "error":
				style = "\x1b[31m";
				break;
			case "instock":
				style = "\x1b[32m\x1b[4m";
				break;
			default:
				style = "\x1b[0m";
		}
		console.log(style + time, this.name + ":", ...message);
	}

	isToday(someDate) {
		if (!someDate) return false;
		const today = new Date();
		return (
			someDate.getDate() == today.getDate() &&
			someDate.getMonth() == today.getMonth() &&
			someDate.getFullYear() == today.getFullYear()
		);
	}
}

module.exports = SupplyChecker;
