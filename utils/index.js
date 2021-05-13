function getTimestamp() {
	return (
		"[" +
		new Date().toLocaleString("en-US", { timeZone: "America/New_York" }) +
		"]"
	);
}

function isToday(someDate) {
	if (!someDate) return false;
	const today = new Date();
	return (
		someDate.getDate() == today.getDate() &&
		someDate.getMonth() == today.getMonth() &&
		someDate.getFullYear() == today.getFullYear()
	);
}

function print(alert, ...message) {
	const time = getTimestamp();
	let style;
	switch (alert) {
		case "error":
			style = "\x1b[31m";
			break;
		case "instock":
			style = "\x1b[32m\x1b[4m";
			break;
		default:
			style = "\x1b[0m";
	}
	console.log(style + time, "Server:", ...message);
}

module.exports = {
	getTimestamp,
	isToday,
	print,
};
