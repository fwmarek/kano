const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const CHANNEL_ID = 'ssu channel id';
const PING_ROLE_ID = 'sessions notification roelid';
const ALLOWED_ROLE_ID = 'session perms roleid';
const BANNER_IMAGE_URL = 'banner URL';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ssulow')
    .setDescription('Send a low activity session boost announcement.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Role permission check
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setColor('Yellow')
      .setTitle('**Session Boost - insert sezrver name**')
      .setDescription('The in-game server is still up! Join us for some amazing, professional roleplays!')
      .setImage(BANNER_IMAGE_URL);

    const quickJoinButton = new ButtonBuilder()
      .setLabel('Quick Join')
      .setStyle(ButtonStyle.Link)
      .setURL('ERLC quick join URL');

    const row = new ActionRowBuilder().addComponents(quickJoinButton);

    const channel = await interaction.client.channels.fetch(CHANNEL_ID);

    await channel.send({
      content: `<@&${PING_ROLE_ID}>`,
      embeds: [embed],
      components: [row],
    });

    await interaction.reply({ content: '✅ Low session boost sent.', ephemeral: true });
  },
};
