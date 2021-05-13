require("dotenv").config();
const cron = require("node-schedule");
const http = require("http");
const express = require("express");
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const SupplyChecker = require("./supplyChecker");
const app = express();
const TEST =
	"https://www.bestbuy.com/site/macbook-air-13-3-laptop-apple-m1-chip-8gb-memory-256gb-ssd-latest-model-gold/6418599.p?skuId=6418599";
const GPU =
	"https://www.bestbuy.com/site/nvidia-geforce-rtx-3080-10gb-gddr6x-pci-express-4-0-graphics-card-titanium-and-black/6429440.p?skuId=6429440";
const PS5 =
	"https://www.bestbuy.com/site/sony-playstation-5-console/6426149.p?skuId=6426149";
const AMAZON =
	"https://www.amazon.com/Amazon-Smart-Plug-works-Alexa/dp/B01MZEEFNX/ref=gbps_img_s-5_73d8_315dddac?smid=ATVPDKIKX0DER&pf_rd_p=053dbaf4-c04d-4cb8-a61c-d2729fac73d8&pf_rd_s=slot-5&pf_rd_t=701&pf_rd_i=gb_main&pf_rd_m=ATVPDKIKX0DER&pf_rd_r=PHG6DDVCT3VKRM3AABWC";
const GAMESTOP =
	"https://www.gamestop.com/electronics/cell-phones/accessories/chargers-power-adapters/products/star-wars-millennium-falcon-wireless-charger-with-ac-adapter-only-at-gamestop/11095928.html";

const sc = new SupplyChecker(GPU, "GPU-BB");
const { print } = require("./utils");

sc.init()
	.then(() =>
		cron.scheduleJob("*/5 * * * *", async function () {
			await sc.checkStock();
		})
	)
	.catch((error) => {
		print("error", error.message);
	});

app.use(express.urlencoded({ extended: false }));

app.post("/sms", async (req, res) => {
	const twiml = new MessagingResponse();
	print("info", req.body.Body);
	const textResponse = req.body.Body.split(" ");
	try {
		switch (textResponse[0].toLowerCase()) {
			case "status":
				twiml.message(`Server is running! Status: ${sc.status}`);
				break;
			case "last":
				twiml.message(`Last in stock on: ${sc.lastMessageDate || "Unknown."}`);
				break;
			case "refresh":
				sc.checkStock();
				twiml.message(`Refreshing the page now. `);
				break;
			case "init":
				sc.init();
				twiml.message(`Now initializing the stock checker.`);
				break;
			case "change":
				await sc.changeUrl(textResponse[1]);
				twiml.message(`changing url to ${textResponse[1]}.`);
				break;
			case "url":
				twiml.message(`Url to track: ${sc.url}`);
				break;
			default:
				twiml.message(
					'Type: \n"status" - server status\n"last" - last date in stock' +
						'\n"refresh" - force refresh of page' +
						'\n"init" - initialize the stock checker\n"change" - change the url to check\n"url" - check the url to monitor\n'
				);
				break;
		}
	} catch (error) {
		if (error.message === "SupplyChecker has not been initialized!") {
			twiml.message(`SupplyChecker has not finished initializing...`);
		} else if (error.message === "Cant change the url!") {
			twiml.message(`Can't change the url!`);
		} else print("error", error.message);
	}
	res.writeHead(200, { "Content-Type": "text/xml" });
	res.end(twiml.toString());
});

http.createServer(app).listen(process.env.PORT || 1337, () => {
	print("info", "Express server listening on port 1337");
});
