const { workerData, parentPort } = require("worker_threads");
const SupplyChecker = require("../supplyChecker");
const cron = require("node-schedule");
const { workerPool, getStatus } = require("./main.js");
// You can do any heavy stuff here, in a synchronous way
// without blocking the "main thread"
console.log(workerData);
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
	console.log(message);
	switch (message) {
		case "status":
			parentPort.postMessage(`${sc.name}: ${sc.status}`);
			break;
		case "last":
			parentPort.postMessage(`${sc.name}: ${sc.last}`);
			break;
		case "refresh":
			await sc.checkStock();
			parentPort.postMessage(`${sc.name}: Refreshed the page.`);
			break;
		case "init":
			parentPort.postMessage(`${sc.name}: Initializing`);
			await sc.init();
			break;
		case "change":
			sc.changeUrl();
			parentPort.postMessage(`${sc.name}: ${sc.status}`);
			break;
		case "url":
			parentPort.postMessage(`${sc.name}: ${sc.status}`);
			break;
		case "new":
			parentPort.postMessage(`${sc.name}: ${sc.status}`);
			break;
		case "kill":
			parentPort.postMessage(`${sc.name}: ${sc.status}`);
			break;
	}
});
