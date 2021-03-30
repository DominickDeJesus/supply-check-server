const { workerData, parentPort, name } = require("worker_threads");
const SupplyChecker = require("./supplyChecker");
const cron = require("node-schedule");
const { workerPool } = require("./main.js");
// You can do any heavy stuff here, in a synchronous way
// without blocking the "main thread"
console.log(workerData);
const sc = new SupplyChecker(workerData.url, workerData.name);
workerPool.push({ name: workerData.name, ref: sc });

sc.init()
	.then(() =>
		cron.scheduleJob("*/5 * * * *", async function () {
			await sc.checkStock();
		})
	)
	.catch((error) => {
		console.log(error.message);
	});

// parentPort.postMessage({ data: workerPool });
