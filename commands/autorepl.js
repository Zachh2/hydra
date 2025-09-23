import fs from "fs-extra";
import path from "path";

const cacheFile = path.join(process.cwd(), "cache", "autorep.json");

const autorep = {
  config: {
    name: "autorep",
    version: "1.0.0",
    hasPermission: 0,
    credits: "CThanh (converted by zzach)",
    description: "Create autorep for 1 message",
    usePrefix: true,
    commandCategory: "Group Chat",
    usages: "[autorep] => [text need autorep]",
    cooldowns: 12,
    dependencies: {
      "fs-extra": "",
    },
  },

  async onLoad() {
    if (!fs.existsSync(cacheFile)) {
      fs.writeFileSync(cacheFile, JSON.stringify([]), "utf-8");
    }
  },

  async handleEvent({ api, event }) {
    if (event.type !== "message_unsend" && event.body?.length > 0) {
      const shortcut = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      const thread = shortcut.find((item) => item.id == event.threadID);
      if (thread) {
        const match = thread.shorts.find((item) => item.in === event.body);
        if (match) {
          if (match.out.includes(" | ")) {
            const options = match.out.split(" | ");
            api.sendMessage(
              options[Math.floor(Math.random() * options.length)],
              event.threadID,
              event.messageID
            );
          } else {
            api.sendMessage(match.out, event.threadID, event.messageID);
          }
        }
      }
    }
  },

  async run({ api, event, args }) {
    const { threadID, messageID } = event;
    const content = args.join(" ");
    if (!content) return api.sendMessage("⚠️ Missing arguments.", threadID, messageID);

    // delete autorep
    if (content.startsWith("del ")) {
      const delThis = content.slice(4).trim();
      if (!delThis)
        return api.sendMessage("⚠️ The autorep you need to delete was not found", threadID, messageID);

      const data = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      const thread = data.find((item) => item.id == threadID);
      if (!thread) return api.sendMessage("⚠️ No autorep found for this group", threadID, messageID);

      const index = thread.shorts.findIndex((item) => item.in === delThis);
      if (index === -1)
        return api.sendMessage("⚠️ The autorep you need to delete was not found", threadID, messageID);

      thread.shorts.splice(index, 1);
      fs.writeFileSync(cacheFile, JSON.stringify(data), "utf-8");
      return api.sendMessage("✅ Deleted autorep successfully!", threadID, messageID);
    }

    // show all autoreps
    if (content.startsWith("all")) {
      const data = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      const thread = data.find((item) => item.id == threadID);
      if (!thread || !thread.shorts.length)
        return api.sendMessage("⚠️ There is no autorep at the moment 🦄💜", threadID, messageID);

      let msg = thread.shorts.map((item) => `${item.in} -> ${item.out}`).join("\n");
      return api.sendMessage("Here is the autorep included in the group:\n" + msg, threadID, messageID);
    }

    // add new autorep
    const narrow = content.indexOf(" => ");
    if (narrow === -1)
      return api.sendMessage("⚠️ Wrong format. Use: [autorep] => [response]", threadID, messageID);

    const shortin = content.slice(0, narrow).trim();
    const shortout = content.slice(narrow + 4).trim();

    if (!shortin) return api.sendMessage("⚠️ Missing input text", threadID, messageID);
    if (!shortout) return api.sendMessage("⚠️ Missing output text", threadID, messageID);
    if (shortin === shortout)
      return api.sendMessage("⚠️ Input and output must be different 🦄💜", threadID, messageID);

    const data = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    let thread = data.find((item) => item.id == threadID);

    if (!thread) {
      thread = { id: threadID, shorts: [] };
      data.push(thread);
    }

    const existing = thread.shorts.find((item) => item.in === shortin);
    if (existing) {
      existing.out += " | " + shortout;
      api.sendMessage("⚠️ Autorep already exists in this group, updated output!", threadID, messageID);
    } else {
      thread.shorts.push({ in: shortin, out: shortout });
      api.sendMessage("✅ Autorep created successfully!", threadID, messageID);
    }

    fs.writeFileSync(cacheFile, JSON.stringify(data), "utf-8");
  },
};

export default autorep;
