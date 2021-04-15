require("dotenv").config();
const puppeteer = require("puppeteer");
const { getTimestamp, isToday } = require("./utils");

class SupplyChecker {
	constructor(url) {
		this.finishedInit = false;
		this.status = "uninitialized";
		this.url = url.toLocaleLowerCase();
		this.lastMessageDate = null;
		this.lastScreenPath = null;
		this.tag = `button[data-sku-id="${url.split("skuid=")[1]}"]`;
		this.browserOption =
			process.platform === "linux"
				? {
						args: ["--no-sandbox"],
				  }
				: null;
	}
	async init() {
		console.log(getTimestamp(), " Initializing browser");

		this.browser = await puppeteer.launch({
			headless: true,
			...this.browserOption,
		});

		this.page = await this.browser.newPage();
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
		console.log(getTimestamp(), " Finished initializing");
	}

	async checkStock() {
		try {
			if (!this.finishedInit)
				throw new Error("SupplyChecker has not been initialized!");
			if (this.status === "loading")
				throw new Error("SupplyChecker is already loading a page");

			this.status = "loading";
			await this.page.reload();
			await this.page.waitForSelector(this.tag);

			if (
				(await this.isInStock(this.page, this.tag)) &&
				!isToday(this.lastMessageDate)
			) {
				await this.screenshot();
				await this.sendTextNotification(this.url);
				this.status = "waiting";
				return true;
			}
			this.status = "waiting";
			return false;
		} catch (error) {
			console.log(error);
		}
	}

	async isInStock(page, tag) {
		try {
			if (!this.finishedInit)
				throw new Error("SupplyChecker has not been initialized!");
			const $ = require("cheerio");
			console.log(getTimestamp(), " Loading page content");
			const html = await page.content();
			const buttonText = $(tag, html).text();

			if (buttonText.toLocaleLowerCase() === "sold out") {
				console.log(
					getTimestamp(),
					` Out of stock! Tag content: ${buttonText}`
				);
				return false;
			} else if (buttonText.toLocaleLowerCase().includes("add")) {
				console.log(getTimestamp(), " In stock!!! Tag content: ", buttonText);
				return true;
			} else {
				console.log(
					getTimestamp(),
					" Button content unknown! Tag html content: ",
					`${$(tag, html).html()}`
				);
				return false;
			}
		} catch (error) {
			console.log(error);
			return false;
		}
	}

	async changeUrl(url) {
		this.status = "changing";
		this.url = url.toLocaleLowerCase();
		this.lastMessageDate = null;
		this.tag = `button[data-sku-id="${this.url.split("skuid=")[1]}"]`;
		await this.page.goto(this.url, {
			waitUntil: "load",
		});
		console.log(getTimestamp(), "Changed the url to " + url);
		await this.checkStock();
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

			console.log(getTimestamp(), " Message sent! ", message.sid);
		} catch (error) {
			console.log(
				getTimestamp(),
				"Something went wrong, message was not sent\n",
				error
			);
		}
	}
}

module.exports = SupplyChecker;
