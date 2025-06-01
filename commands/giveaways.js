const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');

const activeGiveaways = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage giveaways')
    .addSubcommand(sub =>
      sub
        .setName('create')
        .setDescription('Create a new giveaway')
        .addStringOption(opt =>
          opt.setName('prize').setDescription('The prize to give away').setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('duration').setDescription('Duration (e.g. 10m, 2h, 1d)').setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('winners').setDescription('Number of winners').setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Channel to send giveaway in').setRequired(true)
        )
        .addBooleanOption(opt =>
          opt.setName('ping').setDescription('Ping everyone?').setRequired(true)
        )
    ),

  async execute(interaction) {
    const requiredRoleId = 'HR ROLEID';
    if (!interaction.member.roles.cache.has(requiredRoleId)) {
      return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    }

    if (interaction.options.getSubcommand() === 'create') {
      const prize = interaction.options.getString('prize');
      const duration = interaction.options.getString('duration');
      const winnersCount = interaction.options.getInteger('winners');
      const channel = interaction.options.getChannel('channel');
      const ping = interaction.options.getBoolean('ping');

      const ms = parseDuration(duration);
      if (!ms) {
        return interaction.reply({ content: 'Invalid duration. Use formats like 10m, 2h, 1d.', ephemeral: true });
      }

      const giveawayId = `${channel.id}-${Date.now()}`;
      const joinButton = new ButtonBuilder()
        .setCustomId(`join-${giveawayId}`)
        .setLabel('Join Giveaway (0)')
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(joinButton);

      const embed = new EmbedBuilder()
        .setTitle(`🎉 Giveaway: ${prize}`)
        .setDescription(`Click the button below to join!\n\n**Duration:** <t:${Math.floor((Date.now() + ms) / 1000)}:R>\n**Winners:** ${winnersCount}`)
        .setColor('Gold')
        .setFooter({ text: `Hosted by ${interaction.user.tag}` });

      const msg = await channel.send({
        content: ping ? '@everyone' : null,
        embeds: [embed],
        components: [row],
      });

      interaction.reply({ content: `Giveaway started in ${channel}!`, ephemeral: true });

      const joinedUsers = new Set();
      activeGiveaways.set(giveawayId, joinedUsers);

      const collector = msg.createMessageComponentCollector({
        time: ms,
        filter: i => i.customId === `join-${giveawayId}`,
      });

      collector.on('collect', async i => {
        if (joinedUsers.has(i.user.id)) {
          await i.reply({ content: 'You already joined this giveaway!', ephemeral: true });
        } else {
          joinedUsers.add(i.user.id);
          const updatedButton = ButtonBuilder.from(joinButton).setLabel(`Join Giveaway (${joinedUsers.size})`);
          const updatedRow = new ActionRowBuilder().addComponents(updatedButton);
          await msg.edit({ components: [updatedRow] });
          await i.reply({ content: 'You joined the giveaway!', ephemeral: true });
        }
      });

      collector.on('end', async () => {
        const users = Array.from(joinedUsers);
        if (users.length === 0) {
          msg.reply('No one joined the giveaway.');
        } else {
          const winners = shuffle(users).slice(0, winnersCount);
          const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
          msg.reply(`🎉 Congratulations ${winnerMentions}, you won **${prize}**!`);
        }
      });
    }
  },
};

function parseDuration(input) {
  const match = input.match(/^(\d+)([smhd])$/);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * multipliers[unit];
}

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
