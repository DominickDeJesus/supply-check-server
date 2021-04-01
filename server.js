require("dotenv").config();
const http = require("http");
const express = require("express");
const client = require("twilio")(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN
);
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const app = express();
const URL =
	"https://www.bestbuy.com/site/nvidia-geforce-rtx-3080-10gb-gddr6x-pci-express-4-0-graphics-card-titanium-and-black/6429440.p?skuId=6429440";
const PS5 =
	"https://www.bestbuy.com/site/sony-playstation-5-console/6426149.p?skuId=6426149";
const { workerPool, runWorker, getScraperInfo } = require("./workers/main");

runWorker(URL, "bestbuy");
const sc = workerPool[0];

const { getTimestamp } = require("./utils");

app.use(express.urlencoded({ extended: false }));

app.post("/sms", async (req, res) => {
	console.log(getTimestamp(), req.body.Body);
	const twiml = new MessagingResponse();
	const textReq = req.body.Body.split(" ");
	const reqType = textReq[0].toLowerCase();
	const scraperName = textReq[1]?.toLowerCase();
	try {
		const [request, textRes] = getServerReply(reqType, scraperName, textReq);
		getScraperInfo(scraperName, request);
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

async function sendTextNotification(message) {
	try {
		await client.messages.create({
			body: `${message}`,
			from: process.env.TWILIO_PHONE_NUM,
			to: process.env.TO_PHONE_NUM,
		});
		console.log(getTimestamp(), message);
	} catch (error) {
		console.log(
			getTimestamp(),
			"Something went wrong, message was not sent\n",
			error
		);
	}
}

function getServerReply(reqType, scraperName, textResponse) {
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
			response = `changing url of ${scraperName} to ${textResponse[2]}.`;
			break;
		case "url":
			response = `Url to track: ${sc.url}`;
			break;
		case "new":
			response = `Adding new tracker: ${scraperName} ${textResponse[2].toLowerCase()}`;
			break;
		case "kill":
			response = `terminating worker${scraperName}`;
			break;
		default:
			response =
				'Type: <request-type> <tracker-name> <other-options>\n"status" - server status\n"last" - last date in stock' +
				'\n"refresh" - force refresh of page' +
				'\n"init" - initialize the stock checker\n"change" - change the url to check\n"url" - check the url to monitor\n';

			return [null, response];
	}
	return [reqType, response];
}

// switch () {
// 	case "status":
// 		twiml.message(`Server is running! Sending status...`);
// 		return
// 		getScraperInfo(scraperName, reqType);
// 		break;
// 	case "last":
// 		twiml.message(`Getting the last in-stock date`+scraperName?"...":` for ${scraperName}...`);
// 		getScraperInfo(scraperName, reqType);
// 		break;
// 	case "refresh":
// 		twiml.message(
// 			`Checking status now`+scraperName?"...":` for ${scraperName}...`
// 		);
// 		getScraperInfo(scraperName, reqType);

// 		break;
// 	case "init":
// 		await sc.init();
// 		twiml.message(`Now initializing the stock checker.`);
// 		getScraperInfo(scraperName, reqType);

// 		break;
// 	case "change":
// 		if (textResponse[1].includes("bestbuy.com")) {
// 			twiml.message(`changing url to ${textResponse[1]}.`);
// 			sc.changeUrl(textResponse[1]);
// 		} else {
// 			twiml.message(
// 				`Url was not changed, please follow this format:\nchange bestbuy.com/example/product/page`
// 			);
// 		}
// 		break;
// 	case "url":
// 		twiml.message(`Url to track: ${sc.url}`);
// 		break;
// 	case "new":
// 		runWorker(scraperName, textResponse[2].toLowerCase());
// 		twiml.message(
// 			`Adding new tracker: ${scraperName} ${textResponse[2].toLowerCase()}`
// 		);
// 		break;
// 	case "kill":
// 		const worker = workerPool.find(
// 			(worker) => worker.name === scraperName
// 		);
// 		if (worker) {
// 			worker.terminate();
// 			twiml.message("Worker terminated!");
// 		} else {
// 			twiml.message(
// 				`Could not find worker named: ${scraperName}`
// 			);
// 		}
// 		break;

// 	default:
// 		twiml.message(
// 			'Type: \n"status" - server status\n"last" - last date in stock' +
// 				'\n"refresh" - force refresh of page' +
// 				'\n"init" - initialize the stock checker\n"change" - change the url to check\n"url" - check the url to monitor\n'
// 		);
// 		break;
