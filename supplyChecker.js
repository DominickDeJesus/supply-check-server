require("dotenv").config();
const puppeteer = require("puppeteer");
const { getTimestamp, isToday } = require("./utils");

class SupplyChecker {
	constructor(url) {
		this.finishedInit = false;
		this.url = url;
		this.lastMessageDate = null;
		this.lastScreenPath = null;
		this.tag = `button[data-sku-id="${url.split("skuId=")[1]}"]`;
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

		await this.page.goto(this.url, {
			waitUntil: "load",
		});
		this.finishedInit = true;
		console.log(getTimestamp(), " Finished initializing");
	}

	async checkStock() {
		if (!this.finishedInit)
			throw new Error("SupplyChecker has not been initialized!");

		await this.page.reload();
		if (
			(await this.isInStock(this.page, this.tag)) &&
			!isToday(this.lastMessageDate)
		) {
			this.sendTextNotification(url);
			lastMessageDate = new Date();
			await this.screenshot();
			return true;
		}
		return false;
	}

	async isInStock(page, tag) {
		if (!this.finishedInit)
			throw new Error("SupplyChecker has not been initialized!");
		const $ = require("cheerio");
		try {
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
		this.url = url;
		this.lastMessageDate = null;
		await this.page.goto(this.url, {
			waitUntil: "load",
		});
	}

	async screenshot() {
		if (!this.finishedInit)
			throw new Error("SupplyChecker has not been initialized!");

		this.lastScreenPath = `tmp/screenshots/${this.lastMessageDate}-screenshot.png`;
		await this.page.screenshot({
			path: this.lastScreenPath,
			fullPage: true,
		});
	}
	async sendTextNotification(url) {
		if (!this.finishedInit)
			throw new Error("SupplyChecker has not been initialized!");
		try {
			const client = require("twilio")(
				process.env.TWILIO_ACCOUNT_SID,
				process.env.TWILIO_AUTH_TOKEN
			);

			const message = await client.messages.create({
				body: `In stock alert!!! \n\n${url}`,
				from: process.env.FROM_PHONE,
				mediaUrl: this.lastScreenPath,
				to: process.env.TO_PHONE,
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
