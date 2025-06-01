const fs = require('fs');
const path = require('path');
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  Events,
  REST,
  Routes,
} = require('discord.js');
require('dotenv').config();

// Reorder options (required ones first)
function reorderOptions(options) {
  if (!Array.isArray(options)) return options;
  options.forEach((opt) => {
    if (opt.options) opt.options = reorderOptions(opt.options);
  });
  return options.sort((a, b) => (a.required === b.required ? 0 : a.required ? -1 : 1));
}

// Deploy slash commands
async function deployCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
      const json = command.data.toJSON();
      if (json.options) json.options = reorderOptions(json.options);
      commands.push(json);
    } else {
      console.warn(`[WARNING] Skipping "${file}" — missing "data" or "execute".`);
    }
  }

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    console.log('🔄 Deploying slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Slash commands deployed.');
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

// Load commands
const commandsDir = path.join(__dirname, 'commands');
fs.readdirSync(commandsDir)
  .filter((file) => file.endsWith('.js'))
  .forEach((file) => {
    const command = require(path.join(commandsDir, file));
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[WARNING] Skipping "${file}" — missing "data" or "execute".`);
    }
  });

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (command) await command.execute(interaction);
    }
    // Buttons
    else if (interaction.isButton()) {
      const { customId } = interaction;

      if (customId.startsWith('void-toggle-')) {
        const cmd = client.commands.get('case-status');
        if (cmd?.handleButton) await cmd.handleButton(interaction);
        return;
      }

      if (customId === 'vote-yes' || customId === 'view-voters') {
        const cmd = client.commands.get('ssuvote');
        if (cmd?.handleButton) await cmd.handleButton(interaction);
        return;
      }

    }
  } catch (err) {
    console.error('❌ Interaction Error:', err);
    const errorReply = { content: 'An error occurred while executing the command.', ephemeral: true };
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorReply);
      } else {
        await interaction.reply(errorReply);
      }
    } catch (replyError) {
      console.error('❌ Failed to reply to interaction:', replyError);
    }
  }
});

// Start bot
(async () => {
  await deployCommands();
  if (!process.env.TOKEN) {
    console.error('❌ Bot token missing from .env!');
    return;
  }
  await client.login(process.env.TOKEN);
})();
