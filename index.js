const easyvk = require("easyvk");
const Telegraf = require("telegraf");

require("dotenv").config();

let telegram_token = process.env.TELEGRAM_TOKEN;
let vk_token = process.env.VK_TOKEN;
let chat_id = process.env.TELEGRAM_CHAT_ID;
const SocksAgent = require("socks5-https-client/lib/Agent");

console.log(chat_id);
const socksAgent = new SocksAgent({
  socksHost: `127.0.0.1`,
  socksPort: `9050`,
});

const bot = new Telegraf(telegram_token, {
  telegram: { agent: socksAgent },
});

bot.on("text", (ctx) => console.log(ctx.message.chat.id));

easyvk({
  token: vk_token,
  utils: {
    bots: true,
  },
})
  .then((vk) => {
    const LPB = vk.bots.longpoll;

    LPB.connect({
      forGetLongPollServer: {
        lp_version: 2, //Изменяем версию LongPoll, в EasyVK используется версия 2
        need_pts: 1,
      },
    }).then((connection) => {
      connection.debug(({ type, data }) => {
        //console.log(type, data);
      });

      connection.on("wall_post_new", async (msg) => {
        console.log(msg);
        console.log(msg.attachments);

        if (msg.attachments) {
          let arr_media = [];
          let s_link = "";

          for (let i = 0; i < msg.attachments.length; i++) {
            if (msg.attachments[i].type === "photo") {
              arr_media.push({
                type: "photo",
                media: msg.attachments[i].photo.photo_604,
              });
            } else if (msg.attachments[i].type === "link") {
              s_link = msg.attachments[i].link.url;
            } else if (msg.attachments[i].type === "doc") {
              if (msg.text != "") {
                bot.telegram.sendDocument(
                  chat_id,
                  msg.attachments[i].doc.url,
                  (caption = msg.text)
                );
              } else {
                bot.telegram.sendDocument(chat_id, msg.attachments[i].doc.url);
              }
            }
          }

          if (arr_media.length != 0) {
            bot.telegram.sendMediaGroup(chat_id, arr_media);
          } else if (msg.text != "" && msg.text.indexOf(s_link) == -1) {
            await bot.telegram.sendMessage(chat_id, msg.text);
            bot.telegram.sendMessage(chat_id, s_link);
          } else {
            bot.telegram.sendMessage(chat_id, msg.text);
          }
        } else {
          bot.telegram.sendMessage(chat_id, msg.text + "\n");
        }

        bot.startPolling();
        bot.launch();
      });
    });
  })
  .catch((e) => {
    console.log(e);
  });
