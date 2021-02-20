### Stock Checking Server

This server will check the supply of a given the link to a bestbuy product page. When the product has been restocked, the user will recieve a text message with the link to the product.

## Development Setup

```
git@github.com:DominickDeJesus/supply-check-server.git
cd supply-check-server
cp sample.env .env
npm install
```

Sing up for a twilio account and go to the developer console.

https://www.twilio.com/login

In the `.env` file, add these values from the developer console.

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUM=
```

And the number to send the notifications to.

```
TO_PHONE_NUM=
```

To test the server you can use `ngrok` to have a temporary url to host the server.

https://dashboard.ngrok.com/get-started/setup

Download and run the command:

`./ngrok http 1337`

Copy the url given by the command and add that in the next step.

Select the twilio number and change the webook url for messageing to your temparary ngrok url.

https://www.twilio.com/console/phone-numbers

Run the server with either command

```
npm start
```

or

```
npm test
```

## Resources

Puppeteer troubleshooting

https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md

Twilio docs for getting statred

https://www.twilio.com/docs/sms/quickstart/node
