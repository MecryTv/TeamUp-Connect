require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { CommandKit } = require("commandkit");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

new CommandKit({
  client,
  commandsPath: path.join(__dirname, "commands"),
  eventsPath: path.join(__dirname, "events"),
  validationsPath: path.join(__dirname, "validations"),
  devGuildIds: ["1162553851187040326"],
  devRoleIds: ["1286386691925344390"],
  devUserIds: ["1059621019947634739"],
  skipBuiltInValidations: true,
  bulkRegister: true,
});

client.login(process.env.TOKEN);
