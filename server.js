// Download the helper library from https://www.twilio.com/docs/node/install
// Your Account Sid and Auth Token from twilio.com/console
// and set the environment variables. See http://twil.io/secure
require("dotenv").config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
const http = require("http");
const express = require("express");
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const supplyChecker = require("./supplyChecker");
const app = express();

supplyChecker();
app.use(express.urlencoded({ extended: false }));

app.post("/sms", (req, res) => {
  const twiml = new MessagingResponse();
  const textResponse = req.body.Body.toLowerCase();
  console.log(req.body.Body);
  switch (textResponse) {
    case "status":
      twiml.message("Server is running!");
      break;
    case "last":
      twiml.message("");
      break;
    case "refresh":
      twiml.message("Hi right back to you");
      break;
    default:
      twiml.message(
        'Type: \n"status" - server status\n"last" - last date in stock\n"refresh" - force refresh of page'
      );
      break;
  }
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

http.createServer(app).listen(1337, () => {
  console.log("Express server listening on port 1337");
});
