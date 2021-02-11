require("dotenv").config();
const puppeteer = require("puppeteer");
const cron = require("node-schedule");
const URL =
  "https://www.bestbuy.com/site/nvidia-geforce-rtx-3080-10gb-gddr6x-pci-express-4-0-graphics-card-titanium-and-black/6429440.p?skuId=6429440";
const TAG = `button[data-sku-id="${URL.split("skuId=")[1]}"]`;
let lastMessageDate = new Date("1995-12-17T03:24:00");
const isLinux = process.platform === "linux";
const {
  isInStock,
  sendTextNotification,
  getTimestamp,
  screenshot,
  isToday,
} = require("./functions");

//Entry function
const supplyChecker = async () => {
  try {
    const browserOption = isLinux
      ? { executablePath: "chromium-browser" }
      : null;
    const browser = await puppeteer.launch({
      headless: true,
      ...browserOption,
    });
    console.log(getTimestamp(), " Browser created");

    const page = await browser.newPage();
    console.log(getTimestamp(), " Window created");
    await page.setDefaultNavigationTimeout(0);

    await page.goto(URL, {
      waitUntil: "load",
      // Remove the timeout
      timeout: 0,
    });
    if (await isInStock(page, TAG)) {
      lastMessageDate = new Date();
      await page.screenshot({
        path: `./screenshots/${lastMessageDate}-screenshot.png`,
        fullPage: true,
      });
      sendTextNotification(URL);
    }

    cron.scheduleJob("*/5 * * * *", async function () {
      if ((await isInStock(page, TAG)) && !isToday(lastMessageDate)) {
        sendTextNotification(URL);
        lastMessageDate = new Date();
        await page.screenshot({
          path: `./screenshots/${lastMessageDate}-screenshot.png`,
          fullPage: true,
        });
      }
      await page.reload();
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = supplyChecker;
