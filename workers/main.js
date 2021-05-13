const client = require("twilio")(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN
);
const { Worker } = require("worker_threads");
const { getTimestamp } = require("../utils");
//holds all of the workers
const workerPool = [];

function runService(workerData) {
	const worker = new Worker("./workers/service.js", {
		workerData,
	});
	workerPool.push({ worker: worker, name: workerData.name });

	worker.on("message", (message) => {
		sendTextNotification(message);
	});
	worker.on("error", (err) => {
		console.log(err);
	});
	worker.on("exit", (code) => {
		if (code !== 0) new Error(`Worker stopped with exit code ${code}`);
	});
}

function getScraperInfo(workerName, reqType, url) {
	const foundWorker = workerPool.find((worker) => {
		return worker.name === workerName;
	});
	if (reqType === "kill") {
		const index = workerPool.indexOf(foundWorker);
		workerPool.splice(index, 1);
		foundWorker.worker.terminate();
	}
	if (reqType === "new") {
		runService({ url: url, name: workerName });
	}
	if (foundWorker)
		return foundWorker.worker.postMessage({
			reqType: reqType,
			url: url,
		});
	workerPool.forEach((worker) =>
		worker.worker.postMessage({
			reqType: reqType,
			url: url,
		})
	);
}

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

module.exports = { workerPool, getScraperInfo, runService };
