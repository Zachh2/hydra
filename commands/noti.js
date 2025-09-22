const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "noti",
  info: "Send a broadcast notification to all groups",
  dev: "Jonell Magallanes",
  onPrefix: true,
  usedby: 3,
  dmUser: false,
  usages: "[your message]",
  cooldowns: 5,

  onLaunch: async function ({ api, event, target, actions }) {
    const content = target.join(" ");
    if (!content) return actions.reply("Please provide a message to broadcast.");

    const loading = await actions.reply("🔄 Sending to the group threads...");

    try {
      const senderInfo = await global.getUser(event.senderID);
      const senderName = senderInfo.name || "Zach";

      const threads = await api.getThreadList(20, null, ['INBOX']);
      const groupThreads = threads.filter(thread => thread.isGroup);
      const threadIDs = groupThreads.map(thread => thread.threadID);

      // Handle replied attachment (photo, video, gif)
      let attachment = null;
      if (
        event.messageReply &&
        event.messageReply.attachments &&
        event.messageReply.attachments[0]
      ) {
        const file = event.messageReply.attachments[0];
        const fileType = file.type;
        const fileURL = file.url;

        // Support photo, video, and gif (animated_image)
        if (["photo", "video", "animated_image"].includes(fileType)) {
          let fileExt = "jpg";
          if (fileType === "video") fileExt = "mp4";
          else if (fileType === "animated_image") fileExt = "gif";

          const fileData = await axios.get(fileURL, { responseType: 'arraybuffer' });
          const tempPath = path.join(__dirname, `../temp/noti_${Date.now()}.${fileExt}`);
          fs.writeFileSync(tempPath, fileData.data);
          attachment = fs.createReadStream(tempPath);
        }
      }

      const messageData = {
        body: `👤 𝗡𝗼𝘁𝗶𝗳𝗶𝗰𝗮𝘁𝗶𝗼𝗻\n━━━━━━━━━━━━━━━━━━\n${content}\n\nDeveloper: ${senderName}`,
        attachment: attachment || undefined
      };

      const results = await Promise.all(
        threadIDs.map(threadID => {
          return new Promise(resolve => {
            api.sendMessage(messageData, threadID, err => resolve(!err));
          });
        })
      );

      const successCount = results.filter(success => success).length;

      await actions.edit(
        `📝 𝗦𝗲𝗻𝗱𝗶𝗻𝗴 𝗧𝗵𝗿𝗲𝗮𝗱𝘀 𝗥𝗲𝘀𝘂𝗹𝘁\n━━━━━━━━━━━━━━━━━━\nNotification sent to ${successCount} out of ${threadIDs.length} threads.`,
        loading.messageID
      );

      // Clean up temp file
      if (attachment) fs.unlinkSync(attachment.path);

    } catch (err) {
      console.error(err);
      actions.edit("❌ Failed to send notifications due to an error.", loading.messageID);
    }
  }
};