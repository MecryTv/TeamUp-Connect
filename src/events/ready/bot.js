const { ActivityType } = require("discord.js");
const set = require("../../commands/set");

module.exports = (client) => {
  console.log(`✅ Logged in as ${client.user.username}`);

  let status = [
    {
      name: "TeamUp Connections",
      type: ActivityType.Watching,
    },
    {
      name: "Use /help",
      type: ActivityType.Listening,
    },
    {
      name: "Developed by MecryTv",
      type: ActivityType.Custom,
    },
  ];

  setInterval(() => {
    let randomStatus = Math.floor(Math.random() * status.length);
    client.user.setActivity(status[randomStatus]);
  }, 10000);
};
