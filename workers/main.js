// index.js
const workerPool = [];

const { Worker } = require("worker_threads");
const { getTimestamp } = require("../utils");

function runService(workerData) {
	return new Promise((resolve, reject) => {
		const worker = new Worker("./workers/service.js", {
			workerData,
		});
		worker.on("message", resolve);
		worker.on("error", reject);
		worker.on("exit", (code) => {
			if (code !== 0)
				reject(new Error(`Worker stopped with exit code ${code}`));
		});
	});
}

async function runWorker(url, name) {
	const result = await runService({ url: url, name: name });
	console.log(result);
}

function getStatus(workers) {
	// if (singleWorker) return ` ${singleWorker.name} ${singleWorker.status}`;
	return workerPool
		.map((worker) => {
			return `${worker.name} ${worker.status} \n`;
		})
		.join("");
}

module.exports = { workerPool, runWorker, getStatus };
