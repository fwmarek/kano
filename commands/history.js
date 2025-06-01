const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const INFRACTIONS_FILE = path.join(__dirname, '..', 'infractions.json');
const ALLOWED_ROLE_ID = 'insert HR roleID';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('View infraction history for a user.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check.')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const issuer = interaction.user;
    const member = await interaction.guild.members.fetch(issuer.id);

    if (!member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    const target = interaction.options.getUser('user');

    if (!fs.existsSync(INFRACTIONS_FILE)) {
      return interaction.reply({ content: '⚠️ No infractions have been recorded yet.', ephemeral: true });
    }

    const infractions = JSON.parse(fs.readFileSync(INFRACTIONS_FILE, 'utf-8'))
      .filter(entry => entry.userId === target.id);

    if (infractions.length === 0) {
      return interaction.reply({ content: `✅ <@${target.id}> has no infractions.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Infraction History for ${target.tag}`)
      .setColor(0xffcc00)
      .setFooter({ text: `Total: ${infractions.length} infraction(s)` });

    for (const infraction of infractions.slice(-10)) {
      embed.addFields({
        name: `Case #${infraction.caseId}`,
        value:
          `• **Reason:** ${infraction.reason}\n` +
          `• **Punishment:** ${infraction.punishment}\n` +
          `• **Duration:** ${infraction.duration}\n` +
          `• **Notes:** ${infraction.notes}\n` +
          `• **Voided:** ${infraction.voided ? '✅' : '❌'}`
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
