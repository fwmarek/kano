const {
  EmbedBuilder,
  AuditLogEvent,
  Events,
  ChannelType,
} = require('discord.js');

const logChannelId = 'log channelid'; 

module.exports = (client) => {
  function logEmbed(title, description, color = 'Blurple') {
    return new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();
  }

  // AUDIT LOG EVENTS (Ban, Kick, Timeout)
  client.on(Events.GuildBanAdd, async ban => {
    const fetchedLogs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
    const banLog = fetchedLogs.entries.first();
    if (!banLog) return;

    const { executor, reason } = banLog;
    const embed = logEmbed('🔨 Member Banned', `**User:** ${ban.user.tag} (${ban.user.id})\n**By:** ${executor.tag}\n**Reason:** ${reason || 'No reason provided'}`);
    ban.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
  });

  client.on(Events.GuildBanRemove, async unban => {
    const fetchedLogs = await unban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 });
    const unbanLog = fetchedLogs.entries.first();
    if (!unbanLog) return;

    const { executor, reason } = unbanLog;
    const embed = logEmbed('⚖️ Member Unbanned', `**User:** ${unban.user.tag} (${unban.user.id})\n**By:** ${executor.tag}\n**Reason:** ${reason || 'No reason provided'}`);
    unban.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
  });

  client.on(Events.GuildMemberRemove, async member => {
    const fetchedLogs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 });
    const kickLog = fetchedLogs.entries.first();

    if (kickLog && kickLog.target.id === member.id) {
      const { executor, reason } = kickLog;
      const embed = logEmbed('👢 Member Kicked', `**User:** ${member.user.tag} (${member.user.id})\n**By:** ${executor.tag}\n**Reason:** ${reason || 'No reason provided'}`);
      member.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
    } else {
      const embed = logEmbed('📤 Member Left', `**${member.user.tag}** left or was kicked.`);
      member.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
    }
  });

  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    const changes = [];

    if (oldMember.communicationDisabledUntil !== newMember.communicationDisabledUntil) {
      const timeoutSet = newMember.communicationDisabledUntilTimestamp > Date.now();
      const logs = await newMember.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberUpdate,
        limit: 1,
      });

      const log = logs.entries.first();
      const { executor, reason } = log || {};
      if (timeoutSet) {
        const embed = logEmbed('⏱️ Member Timed Out', `**User:** ${newMember.user.tag}\n**Until:** <t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:F>\n**By:** ${executor?.tag || 'Unknown'}\n**Reason:** ${reason || 'No reason provided'}`);
        newMember.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
      } else {
        const embed = logEmbed('🔓 Timeout Removed', `**User:** ${newMember.user.tag}\n**By:** ${executor?.tag || 'Unknown'}`);
        newMember.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
      }
    }

    // Nickname / Role changes
    if (oldMember.nickname !== newMember.nickname) {
      changes.push(`**Nickname changed**: \`${oldMember.nickname || 'None'}\` → \`${newMember.nickname || 'None'}\``);
    }

    const oldRoles = new Set(oldMember.roles.cache.keys());
    const newRoles = new Set(newMember.roles.cache.keys());
    const addedRoles = [...newRoles].filter(id => !oldRoles.has(id));
    const removedRoles = [...oldRoles].filter(id => !newRoles.has(id));
    if (addedRoles.length)
      changes.push(`**Role added:** ${addedRoles.map(id => `<@&${id}>`).join(', ')}`);
    if (removedRoles.length)
      changes.push(`**Role removed:** ${removedRoles.map(id => `<@&${id}>`).join(', ')}`);

    if (changes.length) {
      const embed = logEmbed(`🔁 Member Updated: ${newMember.user.tag}`, changes.join('\n'));
      newMember.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
    }
  });

  // MESSAGE EVENTS
  client.on(Events.MessageDelete, message => {
    if (message.partial || !message.guild || message.author?.bot) return;
    const embed = logEmbed('🗑️ Message Deleted', `**Author:** ${message.author}\n**Channel:** ${message.channel}\n**Content:**\n\`\`\`\n${message.content || 'None'}\n\`\`\``);
    message.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
  });

  client.on(Events.MessageUpdate, (oldMsg, newMsg) => {
    if (oldMsg.partial || newMsg.partial || !oldMsg.guild || oldMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;
    const embed = logEmbed('✏️ Message Edited', `**Author:** ${oldMsg.author}\n**Channel:** ${oldMsg.channel}\n**Before:**\n\`\`\`\n${oldMsg.content}\n\`\`\`\n**After:**\n\`\`\`\n${newMsg.content}\n\`\`\``);
    oldMsg.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
  });

  client.on(Events.MessageBulkDelete, async messages => {
    const guild = messages.first()?.guild;
    if (!guild) return;
    const embed = logEmbed('📦 Bulk Message Deletion', `**${messages.size} messages** were deleted in ${messages.first().channel}`);
    guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
  });

  // CHANNEL EVENTS
  client.on(Events.ChannelCreate, channel => {
    const embed = logEmbed('📁 Channel Created', `**Name:** ${channel.name}\n**Type:** ${ChannelType[channel.type]}`);
    channel.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
  });

  client.on(Events.ChannelDelete, channel => {
    const embed = logEmbed('🗑️ Channel Deleted', `**Name:** ${channel.name}`);
    channel.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
  });

  client.on(Events.ChannelUpdate, (oldChan, newChan) => {
    const changes = [];
    if (oldChan.name !== newChan.name)
      changes.push(`**Name changed**: \`${oldChan.name}\` → \`${newChan.name}\``);
    if (changes.length) {
      const embed = logEmbed(`🔁 Channel Updated: ${newChan.name}`, changes.join('\n'));
      newChan.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
    }
  });

  // ROLE EVENTS
  client.on(Events.GuildRoleCreate, role => {
    const embed = logEmbed('➕ Role Created', `**Name:** <@&${role.id}>`);
    role.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
  });

  client.on(Events.GuildRoleDelete, role => {
    const embed = logEmbed('➖ Role Deleted', `**Name:** ${role.name}`);
    role.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
  });

  client.on(Events.GuildRoleUpdate, (oldRole, newRole) => {
    const changes = [];
    if (oldRole.name !== newRole.name)
      changes.push(`**Name changed**: \`${oldRole.name}\` → \`${newRole.name}\``);
    if (changes.length) {
      const embed = logEmbed(`🔁 Role Updated: ${newRole.name}`, changes.join('\n'));
      newRole.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
    }
  });

  // EMOJI / STICKER
  client.on(Events.GuildEmojiCreate, emoji => {
    const embed = logEmbed('😀 Emoji Created', `**Name:** ${emoji.name}`);
    emoji.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
  });

  client.on(Events.GuildEmojiDelete, emoji => {
    const embed = logEmbed('❌ Emoji Deleted', `**Name:** ${emoji.name}`);
    emoji.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
  });

  client.on(Events.GuildStickerCreate, sticker => {
    const embed = logEmbed('🏷️ Sticker Created', `**Name:** ${sticker.name}`);
    sticker.guild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
  });

  // SERVER UPDATE
  client.on(Events.GuildUpdate, (oldGuild, newGuild) => {
    const changes = [];
    if (oldGuild.name !== newGuild.name)
      changes.push(`**Name changed**: \`${oldGuild.name}\` → \`${newGuild.name}\``);
    if (changes.length) {
      const embed = logEmbed('🏠 Server Updated', changes.join('\n'));
      newGuild.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
    }
  });

  // VOICE EVENTS
  client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const user = newState.member?.user || oldState.member?.user;
    const changes = [];

    if (!oldState.channelId && newState.channelId)
      changes.push(`🔊 **Joined** VC: <#${newState.channelId}>`);
    else if (oldState.channelId && !newState.channelId)
      changes.push(`🔇 **Left** VC: <#${oldState.channelId}>`);
    else if (oldState.channelId !== newState.channelId)
      changes.push(`🔁 **Switched** VC: <#${oldState.channelId}> → <#${newState.channelId}>`);

    if (oldState.selfMute !== newState.selfMute)
      changes.push(`🎙️ **Self Mute:** \`${newState.selfMute}\``);
    if (oldState.selfDeaf !== newState.selfDeaf)
      changes.push(`🔇 **Self Deaf:** \`${newState.selfDeaf}\``);

    if (changes.length && user) {
      const embed = logEmbed(`🎧 Voice Update: ${user.tag}`, changes.join('\n'));
      (newState.guild || oldState.guild)?.channels.cache.get(logChannelId)?.send({ embeds: [embed] });
    }
  });
};
