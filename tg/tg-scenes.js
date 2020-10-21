const Extra = require('telegraf/extra');
const Scene = require('telegraf/scenes/base');

const utils = require('../utils');

const projectsToButtons = (fl, projects, sections) => {
  return Extra.HTML().markup((m) =>
    m.inlineKeyboard([
      [m.callbackButton(`◀️ Exit`, JSON.stringify({ fl, type: 'quit' }))],
      ...Object.keys(projects).map((proj) => [
        m.callbackButton(`#️⃣ ${proj} - ${projects[proj].length} #️⃣`, JSON.stringify({ fl, sec: utils.getKeyByValue(sections, proj), type: 'sec' })),
      ]),
    ])
  );
};

const pagination = (fl, sec, curPage, pageCnt) => {
  // похоже что для button data установлен лимит строки по символам
  return Extra.HTML().markup((m) =>
    m.inlineKeyboard([
      [
        m.callbackButton(`⬅️`, JSON.stringify({ fl, sec, type: 'prev', cur: curPage, cnt: pageCnt })),
        m.callbackButton(`${curPage + 1}/${pageCnt}`, JSON.stringify({ fl, sec, type: 'cnt' })),
        m.callbackButton(`➡️`, JSON.stringify({ fl, sec, type: 'next', cur: curPage, cnt: pageCnt })),
      ],
    ])
  );
};

const paginationController = async (ctx, sec, curPage, update) => {
  let { fl, sections, projects, curScene } = ctx.scene.state;
  let section = sections[sec];
  let cardsPerPage = 3;
  let pageCnt = Math.ceil(projects[section].length / cardsPerPage);
  let start = curPage * cardsPerPage;
  let end = start + cardsPerPage;
  let filteredProjects = projects[section].slice(start, end);

  let html = `<b>${curScene.val.toUpperCase()} ${section} section:</b>`;

  for (let i = 0; i < filteredProjects.length; i++) {
    let proj = filteredProjects[i];
    html += `
----------------------------------------------
  <b><a href="${proj.link}">${proj.title}</a></b>
  <i>Заявки: ${proj.bets}</i>
  <i>Бюджет: ${proj.budget}</i>
  <i>Дата: ${proj.time}</i>
----------------------------------------------`;
  }
  if (!update) {
    let response = await ctx.replyWithHTML(html, {
      reply_markup: pagination(fl, sec, curPage, pageCnt).reply_markup,
      disable_web_page_preview: true,
    });
    ctx.scene.state.messages.push(response);
  } else {
    let msg_id = ctx.scene.state.messages[1].message_id;
    let chat_id = ctx.scene.state.messages[1].chat.id;
    await ctx.telegram.editMessageText(chat_id, msg_id, undefined, html, { parse_mode: 'HTML', disable_web_page_preview: true });
    await ctx.telegram.editMessageReplyMarkup(chat_id, msg_id, undefined, pagination(fl, sec, curPage, pageCnt).reply_markup);
  }
};

const sceneCleaner = () => async (ctx) => {
  ctx.scene.state.messages.forEach(({ message_id: id }) => {
    try {
      ctx.deleteMessage(id);
    } catch (error) {
      console.log(error);
    }
  });
};

class FreelanceScenes {
  constructor() {
    this.messages = [];
    this.curSec = null;
  }
  freelanceScene() {
    const freelance = new Scene('freelance');
    freelance
      .enter(async (ctx) => {
        const { fl, projects, sections, curScene } = ctx.scene.state;

        let response = await ctx.replyWithHTML(
          `
-----------------------------
<b>${curScene.val.toUpperCase()} Sections:</b>
-----------------------------
              `,
          projectsToButtons(fl, projects, sections)
        );

        this.messages.push(response);
        ctx.scene.state.messages = this.messages;
      })
      .leave(sceneCleaner());

    freelance.on('callback_query', async (ctx) => {
      const { sections, curScene } = ctx.scene.state;
      let { type, sec, cur, cnt } = JSON.parse(ctx.callbackQuery.data);

      switch (type) {
        case 'fl':
          await ctx.answerCbQuery('You are not on main scene. First quit from freelance scene.');
          break;
        case 'abort':
          await ctx.answerCbQuery('You are not on main scene. First quit from freelance scene.');
          break;
        case 'sec':
          // console.log(`${curScene.val.toUpperCase()} ${sections[sec]} btn clicked`);
          if (this.curSec === sec) {
            await ctx.answerCbQuery('This section opened.');
            return;
          }

          let update;
          if (this.curSec === null) update = false;
          if (this.curSec !== null && this.curSec !== sec) update = true;

          await paginationController(ctx, sec, 0, update);
          await ctx.answerCbQuery(`${sections[sec]} section opened.`);
          this.curSec = sec;
          break;
        case 'prev':
          if (cur <= 0) {
            await ctx.answerCbQuery('You are on first page.');
          } else {
            await paginationController(ctx, sec, --cur, true);
          }
          break;
        case 'next':
          if (cur >= cnt - 1) {
            await ctx.answerCbQuery('You are on last page.');
          } else {
            await paginationController(ctx, sec, ++cur, true);
          }
          break;
        case 'cnt':
          await ctx.answerCbQuery('current page/total pages');
          break;
        case 'quit':
          await ctx.answerCbQuery(`You are in main scene.`);
          await ctx.scene.leave();
          this.messages = [];
          this.curSec = null;
          curScene.val = null;
          break;
      }
    });

    return freelance;
  }
}

module.exports = FreelanceScenes;
