// Full Ticket System in One File
require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

client.commands = new Collection();

const ticketsCommand = new SlashCommandBuilder()
  .setName("tickets")
  .setDescription("Admin-only command to initiate the support ticket system.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
client.commands.set("tickets", { data: ticketsCommand, execute: executeTickets });

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) await command.execute(interaction);
  }

  if (interaction.isButton()) {
    const { customId, guild, user } = interaction;

    if (customId === "contact_support") {
      await interaction.reply({ content: "Creating ticket channel...", ephemeral: true });

      const category = guild.channels.cache.get("1378240944658448394");
      const supportRoleId = "1376678488068849744";
      const modRoles = ["1376678488068849744", "1376678427289063475", "1376681097626390608"];

      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          { id: guild.id, deny: ["ViewChannel"] },
          { id: user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
          ...modRoles.map((id) => ({ id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] })),
        ],
      });

      await interaction.editReply({ content: `Your ticket is ready! ${ticketChannel}` });

      const ticketEmbed = new EmbedBuilder()
        .setTitle("Support Ticket")
        .setDescription(
          "Thank you for contacting Support. Please do not ping support representatives within the first 24 hours."
        )
        .setColor(0x00ff00)
        .setImage("https://cdn.discordapp.com/attachments/1376316945082880124/1376320097186086963/image.png");

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_close").setLabel("Close").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("ticket_claim").setLabel("Claim").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("ticket_unclaim").setLabel("Unclaim").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("ticket_request_management").setLabel("Request Management").setStyle(ButtonStyle.Primary)
      );

      const msg = await ticketChannel.send({
        content: `<@${user.id}> <@&${supportRoleId}>`,
        embeds: [ticketEmbed],
        components: [buttons],
      });
      await msg.pin();
    }

    if (customId === "ticket_claim") {
      await interaction.reply({ content: `${interaction.user} has claimed this ticket.`, ephemeral: false });
    }

    if (customId === "ticket_unclaim") {
      await interaction.reply({ content: `${interaction.user} has unclaimed this ticket.`, ephemeral: false });
    }

    if (customId === "ticket_request_management") {
      await interaction.reply({ content: `<@&1376681097626390608> Assistance requested.`, ephemeral: false });
    }

    if (customId === "ticket_close") {
      await interaction.reply({ content: "Closing ticket and sending transcript...", ephemeral: true });

      const logsChannel = guild.channels.cache.get("1378242611973984367");
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const content = messages
        .filter((msg) => !msg.author.bot)
        .map((msg) => `${msg.author.tag}: ${msg.content}`)
        .reverse()
        .join("\n");

      const filePath = `./transcript-${interaction.channel.id}.txt`;
      fs.writeFileSync(filePath, content);
      await logsChannel.send({
        content: `Transcript for ${interaction.channel.name}\nOpened by: <@${interaction.channel.topic}>\nClosed by: <@${interaction.user.id}>`,
        files: [filePath],
      });
      fs.unlinkSync(filePath);
      await interaction.channel.delete();
    }
  }
});

async function executeTickets(interaction) {
  const embed = new EmbedBuilder()
    .setTitle("Support Status")
    .setDescription("🟢 Support is currently **online**.")
    .setColor(0x00ff00);

  const button = new ButtonBuilder()
    .setCustomId("contact_support")
    .setLabel("Contact Support")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(button);
  await interaction.reply({ embeds: [embed], components: [row] });
}

client.login(process.env.DISCORD_TOKEN);
