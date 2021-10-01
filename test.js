const cron = require("node-schedule");
const urlObjs = require("./urlData");
const { print } = require("./utils");

const SupplyChecker = require("./SupplyChecker");

const arr = [];

urlObjs.forEach((obj) => {
	const sc = new SupplyChecker(obj.url, obj.name);
	arr.push(sc);
	sc.init()
		.then(async () => {
			print("info", obj.name + ": initializing");
			cron.scheduleJob("*/5 * * * *", async function () {
				await sc.checkStock();
			});
		})
		.catch((error) => {
			console.log(error);
		});
});
