const {
  SlashCommandBuilder,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const fs = require("fs");
const archiver = require("archiver");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Support ticket module (admin only)"),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: "❌ You must be an admin to use this command.",
        ephemeral: true,
      });
    }

    const openBtn = new ButtonBuilder()
      .setCustomId("open_ticket")
      .setLabel("Open a Ticket")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(openBtn);

    await interaction.reply({
      content: "Click below to open a support ticket.",
      components: [row],
      ephemeral: false,
    });
  },

  async handleComponent(interaction, client) {
    if (interaction.customId === "open_ticket") {
      const modal = new ModalBuilder()
        .setTitle("Ticket Reason")
        .setCustomId("ticket_modal")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("reason_input")
              .setLabel("Why are you opening this ticket?")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          )
        );

      return await interaction.showModal(modal);
    }

    if (interaction.customId === "claim_ticket") {
      return await interaction.reply({
        content: `✅ ${interaction.user} has claimed this ticket!`,
        ephemeral: true,
      });
    }

    if (interaction.customId === "close_ticket") {
      await interaction.reply({
        content: `🛑 ${interaction.user} is closing this ticket. Channel will be deleted in 10 seconds.`,
        ephemeral: false,
      });

      const channel = interaction.channel;
      const messages = await channel.messages.fetch({ limit: 100 });
      const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      const transcriptDir = path.join(__dirname, "..", "transcripts");
      if (!fs.existsSync(transcriptDir)) {
        fs.mkdirSync(transcriptDir, { recursive: true });
      }

      const logPath = path.join(transcriptDir, `${channel.name}.txt`);
      const zipPath = path.join(transcriptDir, `${channel.name}.zip`);

      const content = sorted
        .map(m => `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content}`)
        .join("\n");
      fs.writeFileSync(logPath, content);

      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      archive.pipe(output);
      archive.file(logPath, { name: `${channel.name}.txt` });
      await archive.finalize();

      output.on("close", async () => {
        const logChannel = await interaction.guild.channels.fetch("insert TRANSCRIPT CHANNEL");
        await logChannel.send({
          content: `📁 Transcript for ${channel.name}`,
          files: [zipPath],
        });

        setTimeout(() => {
          fs.unlinkSync(logPath);
          fs.unlinkSync(zipPath);
          channel.delete().catch(() => {});
        }, 10000);
      });
    }
  },

  async handleModalSubmit(interaction, client) {
    if (interaction.customId !== "ticket_modal") return;
    const reason = interaction.fields.getTextInputValue("reason_input");

    const ticketChannel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: "insert ticket category ID",
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        ...[
          "replace with staff ID",
          "replace with staff ID",
          "replace with staff ID",
          "replace with staff ID",
          "replace with staff ID",
        ].map((id) => ({
          id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        })),
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
        },
      ],
    });

    const embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setTitle("**Support Ticket - Code 3 Studios**")
      .setDescription(
        "Thank you for contacting the Team. We will have a Official handle this ticket in due regard.\n\nUntil then, please **DO NOT ping any support members.**"
      );

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("claim_ticket")
        .setLabel("Claim")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
      content: `<@${interaction.user.id}> <@&1381773159304269914>`,
      embeds: [embed],
      components: [buttons],
    });

    await ticketChannel.send(`🔔 Ticket Creation Reason:\n\`\`\`${reason}\`\`\``);

    await interaction.reply({
      content: `🎟️ Ticket created: ${ticketChannel}`,
      ephemeral: true,
    });
  },
};
