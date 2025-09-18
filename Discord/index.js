/**
 * Discord bot entry
 * @Author: Aljur Pogoy
 */

const { Client, GatewayIntentBits, REST, Routes, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");

/**
 * @type {import("discord.js").Client<true>}
 */
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

/**
 * @type {import("discord.js").Collection<string, {name: string, description: string, run: Function}>}
 */
client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, "scripts", "commands");
/** @type {string[]} */
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const cmd = require(path.join(commandsPath, file));
  client.commands.set(cmd.name, cmd);
  commands.push({ name: cmd.name, description: cmd.description });
}

/**
 * Regis Slash Command
 * @param {string} appId 
 * @returns {Promise<void>}
 */
async function registerCommands(appId) {
  try {
    console.log("Registering slash commands...");
    await rest.put(Routes.applicationCommands(appId), { body: commands });
    console.log("Commands registered.");
  } catch (err) {
    console.error("Command registration failed:", err);
  }
}

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await registerCommands(client.user.id);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.run({ interaction });
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "❌ Error .", ephemeral: true });
  }
});

client.login(config.token);
