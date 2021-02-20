require("dotenv").config();
const cron = require("node-schedule");
const http = require("http");
const express = require("express");
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const SupplyChecker = require("./supplyChecker");
const app = express();
const URL =
  "https://www.bestbuy.com/site/nvidia-geforce-rtx-3080-10gb-gddr6x-pci-express-4-0-graphics-card-titanium-and-black/6429440.p?skuId=6429440";

const sc = new SupplyChecker(URL);
const { getTimestamp } = require("./utils");

sc.init()
  .then(() =>
    cron.scheduleJob("*/5 * * * *", async function () {
      await sc.checkStock();
    })
  )
  .catch((error) => {
    console.log(error);
  });

app.use(express.urlencoded({ extended: false }));

app.post("/sms", async (req, res) => {
  const twiml = new MessagingResponse();
  const textResponse = req.body.Body.split(" ");
  try {
    switch (textResponse[0]) {
      case "status":
        twiml.message(
          `Server is running! Browser initialized: ${sc.finishedInit}`
        );
        break;
      case "last":
        twiml.message(`Last in stock on: ${sc.lastMessageDate || "Unknown."}`);
        break;
      case "refresh":
        const inStock = await sc.checkStock();
        twiml.message(
          `Checking status now... ${inStock ? "in stock!!!" : "not in stock."} `
        );
        break;
      case "init":
        await sc.init();
        twiml.message(`Now initializing the stock checker.`);
        break;
      case "change":
        if (textResponse[1].includes("bestbuy.com")) {
          await sc.changeUrl(textResponse[1]);
          twiml.message(`Url to check was changed to ${textResponse[1]}.`);
        } else {
          twiml.message(
            `Url was not changed, please follow this format:\nchange bestbuy.com/example/product/page`
          );
        }
        break;
      default:
        twiml.message(
          'Type: \n"status" - server status\n"last" - last date in stock' +
            '\n"refresh" - force refresh of page' +
            '\n"init" - initialize the stock checker\n"change" - change the url to check\n'
        );
        break;
    }
  } catch (error) {
    if (error.message === "SupplyChecker has not been initialized!") {
      twiml.message(`SupplyChecker has not finished initializing...`);
    } else console.log(error.message);
  }
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

http.createServer(app).listen(process.env.PORT || 1337, () => {
  console.log(getTimestamp(), " Express server listening on port 1337");
});
