exports.getTimestamp = () => {
	return (
		"[" +
		new Date().toLocaleString("en-US", { timeZone: "America/New_York" }) +
		"]"
	);
};
