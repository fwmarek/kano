const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');

const CHANNEL_ID = 'ssu channel id';
const ALLOWED_ROLE_ID = 'ssu perms roleid';
const BANNER_IMAGE_URL = 'banner url';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ssd')
    .setDescription('Send a session shutdown notification embed.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Permission check
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setColor('DarkRed')
      .setTitle('**Session Shutdown - insert server name**')
      .setDescription(
        'The in-game server has now shutdown! During this period, do not join the in-game server or moderation actions may be taken against you!\n\n' +
        'Another session will occur shortly, thank you!\n\n' +
        `Shutdown: <t:${Math.floor(Date.now() / 1000)}:F>`
      )
      .setImage(BANNER_IMAGE_URL);

    const channel = await interaction.client.channels.fetch(CHANNEL_ID);

    await channel.send({ embeds: [embed] });

    await interaction.reply({
      content: '✅ Session Shutdown embed sent.',
      ephemeral: true
    });
  }
};
