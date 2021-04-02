const { workerData, parentPort } = require("worker_threads");
const SupplyChecker = require("../supplyChecker");
const cron = require("node-schedule");
const sc = new SupplyChecker(workerData.url, workerData.name);

sc.init()
	.then(() =>
		cron.scheduleJob("*/5 * * * *", async function () {
			await sc.checkStock();
		})
	)
	.catch((error) => {
		console.log(error.message);
	});

parentPort.on("message", async (message) => {
	switch (message.reqType) {
		case "status":
			parentPort.postMessage(`${sc.name}: ${sc.status}`);
			break;
		case "last":
			parentPort.postMessage(`${sc.name}: Last time in stock - ${sc.last}`);
			break;
		case "refresh":
			await sc.checkStock();
			parentPort.postMessage(`${sc.name}: Refreshed the page.`);
			break;
		case "init":
			await sc.init();
			parentPort.postMessage(`${sc.name}: Initializing`);
			break;
		case "change":
			await sc.changeUrl(message.url);
			parentPort.postMessage(`${sc.name}: Status - ${sc.status}`);
			break;
		case "url":
			parentPort.postMessage(`${sc.name}: URL being tracked - ${sc.url}`);
			break;
	}
});
