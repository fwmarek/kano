const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require('discord.js');

const roleOptions = [
  { label: 'Moderator', value: 'Moderator' },
  { label: 'Sr Moderator', value: 'Sr Moderator' },
  { label: 'Administrator', value: 'Administrator' },
  { label: 'Sr Administrator', value: 'Sr Administrator' },
  { label: 'Staff Supervisor', value: 'Staff Supervisor' },
  { label: 'Manager', value: 'Manager' },
  { label: 'Community Manager', value: 'Community Manager' },
  { label: 'Assistant Director', value: 'Assistant Director' },
  { label: 'Deputy Director', value: 'Deputy Director' },
  { label: 'Director', value: 'Director' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Announce a staff promotion')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user being promoted')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('old_rank')
        .setDescription('Their old rank')
        .setRequired(true)
        .addChoices(...roleOptions.map(r => ({ name: r.label, value: r.value }))))
    .addStringOption(option =>
      option.setName('new_rank')
        .setDescription('Their new rank')
        .setRequired(true)
        .addChoices(...roleOptions.map(r => ({ name: r.label, value: r.value }))))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Why are they being promoted?')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction) {
    const allowedRole = 'INSRRT ALLOWED ROLEID TO RUN CMD'; 
    if (!interaction.member.roles.cache.has(allowedRole)) {
      return await interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser('user');
    const oldRank = interaction.options.getString('old_rank');
    const newRank = interaction.options.getString('new_rank');
    const reason = interaction.options.getString('reason');

    const embed = new EmbedBuilder()
      .setColor(insert HEX code for embed color)
 .setImage('INSRERT IMAGE')
      .setDescription(
        `**Staff Promotion - INSERT SERVER NAME**\n\n` +
        `**User:** ${user}\n` +
        `**New Rank:** ${newRank}\n` +
        `**Old Rank:** ${oldRank}\n` +
        `**Reason:** ${reason}`
      );

    const button = new ButtonBuilder()
      .setLabel(`Issuer: ${interaction.user.username}`)
      .setStyle(ButtonStyle.Secondary)
      .setCustomId('issuer-button')
      .setDisabled(true);

    const row = new ActionRowBuilder().addComponents(button);

    const targetChannel = await interaction.client.channels.fetch('INSERT ANNCMENET CHANNEL ID'); // target channel
    if (!targetChannel || !targetChannel.isTextBased()) {
      return interaction.reply({ content: '❌ Could not find the announcement channel.', ephemeral: true });
    }

    await targetChannel.send({
      content: `${user}`, // Ping the promoted user
      embeds: [embed],
      components: [row],
    });

    await interaction.reply({ content: `✅ Promotion announced for ${user}.`, ephemeral: true });
  },
};
