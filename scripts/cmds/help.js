const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "2.2.0",
    author: "NTKhang",
    countDown: 5,
    role: 0,
    shortDescription: "Show command help",
    longDescription: "View all commands or details of specific command",
    category: "info",
    guide: "{pn} [command]"
  },

  onStart: async function ({ message, args, event, role }) {
    const prefix = getPrefix(event.threadID);

    if (!args[0]) {
      // Main help menu
      const categories = {};

      // Organize commands by category
      for (const [name, cmd] of commands) {
        if (cmd.config.role > role) continue;

        const category = cmd.config.category || "Other";
        if (!categories[category]) {
          categories[category] = [];
        }
        categories[category].push(name);
      }

      // Build help message
      let helpMsg = `✨ Alit Help ✨\n` +
                   `🔹 Prefix: ${prefix}\n` +
                   `📅 Updated: ${new Date().toLocaleDateString()}\n\n` +
                   `📚 Categories:\n`;

      // Add categories and commands
      Object.entries(categories).sort().forEach(([category, cmds]) => {
        helpMsg += `\n${getCategoryEmoji(category)} ${category.toUpperCase()}:\n` +
                  `┣ ${cmds.sort().map(cmd => `${cmd} - ${commands.get(cmd).config.shortDescription}`).join("\n┣ ")}\n`;
      });

      helpMsg += `\n🔍 Total  ${commands.size} Commands \n` +
                `ℹ️ Type ${prefix}help [command] for details`;

      await message.reply(helpMsg);
    } else {
      // Command details
      const cmdName = args[0].toLowerCase();
      const command = commands.get(cmdName) || commands.get(aliases.get(cmdName));

      if (!command) {
        await message.reply(`⚠️ Command "${cmdName}" not found!`);
      } else {
        const { config } = command;
        const response = [
          `🌟 Command: ${config.name.toUpperCase()}`,
          `📝 ${config.longDescription?.en || config.shortDescription?.en || "No description"}`,
          `\n🔧 Usage:\n${(config.guide?.en || "{pn}").replace(/{p}/g, prefix).replace(/{n}/g, config.name)}`,
          `\n⚡ Aliases: ${config.aliases?.join(", ") || "None"}`,
          `🛡️ Role: ${["Everyone", "Admin", "Bot Admin"][config.role] || "Custom"}`,
          `⏱️ Cooldown: ${config.countDown || 1}s`,
          `👤 Author: ${config.author || "Unknown"}`,
          `📦 Version: ${config.version || "1.0"}`
        ].join("\n");

        await message.reply(response);
      }
    }
  }
};

// Helper function for category emojis
function getCategoryEmoji(category) {
  const emojiMap = {
    info: "ℹ️",
    nsfw: "🔞", 
    games: "🎮",
    tools: "🛠️",
    group: "👥",
    image: "🖼️",
    owner: "👑",
    utility: "🧰",
    fun: "🎉",
    music: "🎵",
    economy: "💵"
  };
  return emojiMap[category.toLowerCase()] || "📦";
}