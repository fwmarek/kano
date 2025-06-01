const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const CHANNEL_ID = 'ssu channel id';
const ALLOWED_ROLE_ID = 'session perms roleid';
const BANNER_IMAGE_URL = 'banner url';
const QUICK_JOIN_URL = 'erlc quick join URL';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ssufull')
    .setDescription('Send a session full notification embed.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Check if user has the required role
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setColor('Red')
      .setTitle('**Session Full - insert server name**')
      .setDescription(
        'Full Server!\nThe in-game server is now full! Keep trying to join for some amazing, professional roleplays!\n\n' +
        `Got full: <t:${Math.floor(Date.now() / 1000)}:F>`
      )
      .setImage(BANNER_IMAGE_URL);

    const quickJoinButton = new ButtonBuilder()
      .setLabel('Quick Join')
      .setStyle(ButtonStyle.Link)
      .setURL(QUICK_JOIN_URL);

    const row = new ActionRowBuilder().addComponents(quickJoinButton);

    const channel = await interaction.client.channels.fetch(CHANNEL_ID);

    await channel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: '✅ Session Full embed sent.',
      ephemeral: true
    });
  }
};
