async function isInStock(page, tag) {
  const $ = require("cheerio");

  try {
    console.log(getTimestamp(), " Loading page content");
    const html = await page.content();
    const buttonText = $(tag, html).text();

    if (buttonText.toLocaleLowerCase() === "sold out") {
      console.log(getTimestamp(), ` Out of stock! Tag content: ${buttonText}`);
      return false;
    } else if (buttonText.toLocaleLowerCase().includes("add")) {
      console.log(getTimestamp(), " In stock!!! Tag content: ", buttonText);
      return true;
    } else {
      console.log(
        getTimestamp(),
        " Button content unkown! Tag content: ",
        buttonText
      );
      return false;
    }
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function sendTextNotification(url) {
  try {
    // Download the helper library from https://www.twilio.com/docs/node/install
    // Your Account Sid and Auth Token from twilio.com/console
    // and set the environment variables. See http://twil.io/secure
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require("twilio")(accountSid, authToken);

    const message = await client.messages.create({
      body: `In stock alert!!! \n\n${url}`,
      from: process.env.FROM_PHONE,
      to: process.env.TO_PHONE,
    });

    console.log(getTimestamp(), " Message sent! ", message.sid);
  } catch (error) {
    console.log(
      getTimestamp(),
      "Something went wrong, message was not sent\n",
      error
    );
  }
}

function getTimestamp() {
  return (
    "[" +
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" }) +
    "]"
  );
}

function screenshot() {
  return (
    "[" +
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" }) +
    "]"
  );
}
function isToday(someDate) {
  const today = new Date();
  return (
    someDate.getDate() == today.getDate() &&
    someDate.getMonth() == today.getMonth() &&
    someDate.getFullYear() == today.getFullYear()
  );
}

module.exports = {
  isInStock,
  sendTextNotification,
  getTimestamp,
  screenshot,
  isToday,
};
