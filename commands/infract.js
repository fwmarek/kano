const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const INFRACTION_CHANNEL_ID = 'insert infractions channel ID';
const ALLOWED_ROLE_ID = 'insert HR role ID';
const INFRACTIONS_FILE = path.join(__dirname, '..', 'infractions.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infract')
    .setDescription('Issue a staff disciplinary infraction.')
    .addUserOption(option =>
      option.setName('user').setDescription('The user to punish.').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for the infraction.').setRequired(true))
    .addStringOption(option =>
      option.setName('punishment')
        .setDescription('Select punishment type.')
        .setRequired(true)
        .addChoices(
          { name: 'Strike I', value: 'Strike I' },
          { name: 'Strike II', value: 'Strike II' },
          { name: 'Strike III', value: 'Strike III' },
          { name: 'Warning I', value: 'Warning I' },
          { name: 'Warning II', value: 'Warning II' },
          { name: 'Warning III', value: 'Warning III' },
          { name: 'Suspension', value: 'Suspension' },
          { name: 'Termination', value: 'Termination' },
          { name: 'Staff Blacklist', value: 'Staff Blacklist' },
          { name: 'Under Investigation', value: 'Under Investigation' }
        ))
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Enter duration in hours or days (e.g. 24h, 7d).')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('notes')
        .setDescription('Optional notes.')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const issuer = interaction.user;
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const punishment = interaction.options.getString('punishment');
    const durationInput = interaction.options.getString('duration');
    const notes = interaction.options.getString('notes') || 'None';

    // Role restriction
    const member = await interaction.guild.members.fetch(issuer.id);
    if (!member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
    }

    // Convert duration to Discord timestamp
    let timestamp = 'N/A';
    if (durationInput) {
      const now = Math.floor(Date.now() / 1000);
      const match = durationInput.match(/^(\d+)([hd])$/i);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        const seconds = unit === 'h' ? value * 3600 : value * 86400;
        const expiry = now + seconds;
        timestamp = `<t:${expiry}:R>`;
      } else {
        return interaction.reply({ content: '❌ Invalid duration format. Use `24h` or `7d`.', ephemeral: true });
      }
    }

    // Read and update infractions.json
    let infractions = [];
    if (fs.existsSync(INFRACTIONS_FILE)) {
      infractions = JSON.parse(fs.readFileSync(INFRACTIONS_FILE, 'utf-8'));
    }
    const caseId = infractions.length + 1;

    const infraction = {
      caseId,
      userId: targetUser.id,
      reason,
      punishment,
      duration: timestamp,
      notes,
      issuerId: issuer.id,
      date: new Date().toISOString(),
      voided: false
    };

    infractions.push(infraction);
    fs.writeFileSync(INFRACTIONS_FILE, JSON.stringify(infractions, null, 2));

    const embed = new EmbedBuilder()
      .setDescription(`**Staff Diciplinary Action - insert server name**\n\n> **User:** ${targetUser.tag}\n> **Reason:** ${reason}\n> **Punishment:** ${punishment}\n> **Duration:** ${timestamp}\n\n> **Case ID** ${caseId}\n\n> **Notes:** ${notes}`)
      .setColor(insert embed color HEX code)
      .setImage('insert image url');

    const issuerButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('issuer_button') // Required even if disabled
        .setLabel(`Issuer: ${issuer.username}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    try {
      // DM the punished user
      await targetUser.send({ embeds: [embed] });
    } catch {
      await interaction.reply({ content: '⚠️ Could not DM the user, they may have DMs off.', ephemeral: true });
    }

    // Send embed to log channel
    const logChannel = interaction.guild.channels.cache.get(INFRACTION_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({ embeds: [embed], components: [issuerButton] });
    }

    // Public reply
    await interaction.reply({ content: `✅ <@${targetUser.id}> has been infracted.`, ephemeral: false });
  }
};
