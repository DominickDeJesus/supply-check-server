// index.js
const client = require("twilio")(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN
);
const workerPool = [];

const { Worker } = require("worker_threads");
const { getTimestamp } = require("../utils");

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

function runWorker(url, name) {
	runService({ url: url, name: name });
}

function getScraperInfo(workerName, infoType, ...optionals) {
	const foundWorker = workerPool.find((worker) => {
		worker.name === workerName;
	});
	if (foundWorker) return foundWorker.postMessage(infoType, ...optionals);
	workerPool.forEach((worker) =>
		worker.postMessage({ infoType: infoType, optional: optionals })
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

module.exports = { workerPool, runWorker, getScraperInfo };
