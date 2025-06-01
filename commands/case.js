const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const INFRACTIONS_FILE = path.join(__dirname, '..', 'infractions.json');
const STAFF_ROLE_ID = 'insert HR roleid';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('case-status')
    .setDescription('Check the status of a case ID')
    .addIntegerOption(option =>
      option.setName('case_id')
        .setDescription('The Case ID to look up')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const member = interaction.member;
    const caseId = interaction.options.getInteger('case_id');

    if (!member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    if (!fs.existsSync(INFRACTIONS_FILE)) {
      return interaction.reply({ content: 'No infractions found.', ephemeral: true });
    }

    const data = JSON.parse(fs.readFileSync(INFRACTIONS_FILE, 'utf8'));
    const infraction = data.find(entry => entry.caseId === caseId);

    if (!infraction) {
      return interaction.reply({ content: `No case found with ID #${caseId}.`, ephemeral: true });
    }

    const now = Date.now();
    let expirationTime = 0;
    if (infraction.durationTimestamp) {
      expirationTime = Number(infraction.durationTimestamp);
    }
    const isExpired = expirationTime > 0 && expirationTime < now;

    const status = infraction.voided
      ? 'Voided'
      : isExpired
      ? 'Expired'
      : 'Active';

    const embed = new EmbedBuilder()
      .setColor(0xffc107)
      .setTitle(`📄 Case Status: #${caseId}`)
      .setDescription([
        `**User:** <@${infraction.user}>`,
        `**Reason:** ${infraction.reason}`,
        `**Punishment:** ${infraction.punishment}`,
        `**Duration:** ${expirationTime > 0 ? `<t:${Math.floor(expirationTime / 1000)}:F>` : 'Permanent/Not Set'}`,
        `**Notes:** ${infraction.notes || 'None'}`,
        `**Status:** ${status}`
      ].join('\n'));

    const button = new ButtonBuilder()
      .setCustomId(`void-toggle-${caseId}`)
      .setLabel(infraction.voided ? 'Unvoid Case' : 'Void Case')
      .setStyle(infraction.voided ? ButtonStyle.Success : ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  },

  async handleButton(interaction) {
    const member = interaction.member;

    if (!member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: 'You do not have permission to do that.', ephemeral: true });
    }

    const caseIdStr = interaction.customId.replace('void-toggle-', '');
    const caseId = parseInt(caseIdStr, 10);
    if (isNaN(caseId)) return interaction.reply({ content: 'Invalid case ID.', ephemeral: true });

    if (!fs.existsSync(INFRACTIONS_FILE)) {
      return interaction.reply({ content: 'No infractions found.', ephemeral: true });
    }

    const data = JSON.parse(fs.readFileSync(INFRACTIONS_FILE, 'utf8'));
    const infraction = data.find(entry => entry.caseId === caseId);

    if (!infraction) {
      return interaction.reply({ content: 'Case not found.', ephemeral: true });
    }

    infraction.voided = !infraction.voided;
    fs.writeFileSync(INFRACTIONS_FILE, JSON.stringify(data, null, 2));

    await interaction.update({
      content: `✅ Case #${caseId} has been ${infraction.voided ? 'voided' : 'unvoided'}.`,
      components: [],
      ephemeral: true
    });
  }
};
