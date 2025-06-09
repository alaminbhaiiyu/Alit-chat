const { getStreamsFromAttachment } = global.utils;

module.exports = {
  config: {
    name: "notice",
    version: "3.0",
    author: "Alamin Modified",
    role: 2,
    shortDescription: "Send notice to user/group",
    longDescription: "Send notice to inbox, group or selected numbers",
    category: "owner",
    guide: ".notice <message> : all | allgc | user <rank/uid> | group <rank/uid>"
  },

  onStart: async function ({ api, event, message, args }) {
    const fullInput = args.join(" ");
    const splitIndex = fullInput.indexOf(":");

    // যদি ":" না থাকে, তাহলে শুধু ইউজার লিস্ট দেখাবে
    if (splitIndex === -1) {
      const allThreads = await api.getThreadList(1000, null, ["INBOX"]);
      const users = allThreads.filter(t => !t.isGroup);
      const groups = allThreads.filter(t => t.isGroup);

      let reply = `🧑‍💻 ইউজার তালিকা:\n`;
      users.forEach((u, i) => {
        reply += `${i + 1}. ${u.name || "Unknown"} (${u.threadID})\n`;
      });

      reply += `\n👥 গ্রুপ তালিকা:\n`;
      groups.forEach((g, i) => {
        reply += `${i + 1}. ${g.name || "Unknown"} (${g.threadID})\n`;
      });

      return message.reply(reply);
    }

    // ":" আছে, তাহলে message আর command split করবো
    const msg = fullInput.slice(0, splitIndex).trim();
    const cmd = fullInput.slice(splitIndex + 1).trim().toLowerCase();
    const decoratedMsg = `━━━━━━━━━━━━━━━━━━\n🔊 𝐌𝐞𝐬𝐬𝐚𝐠𝐞 𝐅𝐫𝐨𝐦 𝐀𝐝𝐦𝐢𝐧\n━━━━━━━━━━━━━━━━━━\n\n${msg}`;

    const formSend = {
      body: decoratedMsg,
      attachment: await getStreamsFromAttachment([
        ...event.attachments,
        ...(event.messageReply?.attachments || [])
      ])
    };

    const allThreads = await api.getThreadList(1000, null, ["INBOX"]);
    const users = allThreads.filter(t => !t.isGroup);
    const groups = allThreads.filter(t => t.isGroup);
    let targets = [];

    // Command parsing
    if (cmd === "all") {
      targets = [...users, ...groups];
    } else if (cmd === "allgc") {
      targets = [...groups];
    } else if (cmd.startsWith("user ")) {
      const key = cmd.slice(5).trim();
      const match = users[parseInt(key) - 1] || users.find(u => u.threadID === key);
      if (match) targets = [match];
    } else if (cmd.startsWith("group ")) {
      const key = cmd.slice(6).trim();
      const match = groups[parseInt(key) - 1] || groups.find(g => g.threadID === key);
      if (match) targets = [match];
    } else {
      return message.reply("❌ ভুল ফরম্যাট! সঠিকভাবে ব্যবহার করুন:\n.notice <msg> : all | allgc | user <rank/uid> | group <rank/uid>");
    }

    if (targets.length === 0) return message.reply("কোনো বৈধ লক্ষ্য পাওয়া যায়নি।");

    let success = 0;
    let fail = [];

    for (const t of targets) {
      try {
        await api.sendMessage(formSend, t.threadID);
        success++;
      } catch (e) {
        fail.push(t.threadID);
      }
      await new Promise(r => setTimeout(r, 1500));
    }

    message.reply(`✅ সফলভাবে পাঠানো হয়েছে ${success} জনকে।${fail.length ? `\n❌ ব্যর্থ UID: ${fail.join(", ")}` : ""}`);
  }
};