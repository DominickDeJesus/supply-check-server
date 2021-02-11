function getTimestamp() {
  return (
    "[" +
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" }) +
    "]"
  );
}

const isToday = (someDate) => {
  if (!someDate) return false;
  const today = new Date();
  return (
    someDate.getDate() == today.getDate() &&
    someDate.getMonth() == today.getMonth() &&
    someDate.getFullYear() == today.getFullYear()
  );
};

module.exports = {
  getTimestamp,
  isToday,
};
