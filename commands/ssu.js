const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require('discord.js');

const SSU_CHANNEL_ID = 'ssu channel id ';
const PING_ROLE_ID = 'sessions roeleid';
const ALLOWED_ROLE_ID = 'session perms roleid';
const QUICK_JOIN_URL = 'ERLC quick joine URL';
const BANNER_IMAGE_URL = 'banner URL';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ssu')
    .setDescription('Announce a Session Startup.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true,
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const embed = new EmbedBuilder()
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setColor('Blurple')
      .setDescription(
        `**Session Startup - insert server name**\n\n` +
        `A session has been initiated! If you voted during the voting period, you are required to join the server to avoid moderation!\n\n` +
        `•⠀Server Owner: \`insert server owner\`\n` +
        `•⠀Server Name: \`insert server name\`\n` +
        `•⠀Server Code: \`insert server joincode\`\n\n` +
        `Session Started: <t:${timestamp}:R>`
      )
      .setImage(BANNER_IMAGE_URL);

    const quickJoinButton = new ButtonBuilder()
      .setLabel('Quick Join')
      .setStyle(ButtonStyle.Link)
      .setURL(QUICK_JOIN_URL);

    const row = new ActionRowBuilder().addComponents(quickJoinButton);

    const channel = await interaction.client.channels.fetch(SSU_CHANNEL_ID);

    await channel.send({
      content: `@here <@&${PING_ROLE_ID}>`,
      embeds: [embed],
      components: [row],
    });

    await interaction.reply({ content: '✅ Session announcement has been posted.', ephemeral: true });
  },
};
