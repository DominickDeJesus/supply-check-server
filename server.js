require("dotenv").config();
const http = require("http");
const express = require("express");
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const app = express();
const URL =
	"https://www.bestbuy.com/site/nvidia-geforce-rtx-3080-10gb-gddr6x-pci-express-4-0-graphics-card-titanium-and-black/6429440.p?skuId=6429440";
const { runWorker, getScraperInfo } = require("./workers/main");
const { getTimestamp } = require("./utils");

runWorker(URL, "gcard");

app.use(express.urlencoded({ extended: false }));

app.post("/sms", async (req, res) => {
	console.log(getTimestamp(), req.body.Body);
	const twiml = new MessagingResponse();
	const textReq = req.body.Body.split(" ");
	const reqType = textReq[0].toLowerCase();
	const scraperName = textReq[1]?.toLowerCase();
	const url = textReq[2].toLowerCase();
	try {
		const [request, textRes] = getServerReply(reqType, scraperName, url);
		if (!request) getScraperInfo(scraperName, request, url);
		twiml.message(textRes);
	} catch (error) {
		if (error.message === "SupplyChecker has not been initialized!") {
			twiml.message(`SupplyChecker has not finished initializing...`);
		} else console.log(error);
	}
	res.writeHead(200, { "Content-Type": "text/xml" });
	res.end(twiml.toString());
});

http.createServer(app).listen(process.env.PORT || 1337, () => {
	console.log(getTimestamp(), " Express server listening on port 1337");
});

function getServerReply(reqType, scraperName, url) {
	let response = "";

	switch (reqType) {
		case "status":
			response = `Server is running! Sending status...`;
			break;
		case "last":
			response =
				`Getting the last in-stock date` + scraperName
					? "..."
					: ` for ${scraperName}...`;
			break;
		case "refresh":
			response =
				`Checking status now` + scraperName ? "..." : ` for ${scraperName}...`;
			break;
		case "init":
			response = `Now initializing the stock checker.`;
			break;
		case "change":
			response = `changing url of ${scraperName} to ${url}.`;
			break;
		case "url":
			response = `Url to track: ${url}`;
			break;
		case "new":
			response = `Adding new tracker: ${scraperName} ${url}`;
			break;
		case "kill":
			response = `terminating worker: ${scraperName}`;
			break;
		default:
			response =
				'Type: <request-type> <tracker-name> <url>\n"status" - server status\n"last" - last date in stock' +
				'\n"refresh" - force refresh of page' +
				'\n"init" - initialize the stock checker\n"change" - change the url to check\n"url" - check the url to monitor\n' +
				'"new" - create a new webscraper\n"kill" - stop running a scraper';

			return [null, response];
	}
	return [reqType, response];
}
