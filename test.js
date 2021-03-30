const SupplyChecker = require("./SupplyChecker");
const URL =
	"https://www.bestbuy.com/site/nvidia-geforce-rtx-3080-10gb-gddr6x-pci-express-4-0-graphics-card-titanium-and-black/6429440.p?skuId=6429440";
const TESTURL =
	"https://www.bestbuy.com/site/sony-playstation-pulse-3d-wireless-headset-compatible-for-both-playstation-4-playstation-5-white/6430164.p?skuId=6430164";
const PS5 =
	"https://www.bestbuy.com/site/sony-playstation-5-console/6426149.p?skuId=6426149";
const sc = new SupplyChecker(TESTURL);
sc.init()
	.then(async () => {
		console.log("initializing");
		await sc.checkStock();
	})
	.catch((error) => {
		console.log(error);
	});
