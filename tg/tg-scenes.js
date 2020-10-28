const Extra = require('telegraf/extra');
const Scene = require('telegraf/scenes/base');

const utils = require('../utils');

const projectsToButtons = (fl, allProjects, sections) => {
  return Extra.HTML().markup((m) =>
    m.inlineKeyboard([
      [m.callbackButton(`◀️ Exit`, JSON.stringify({ fl, type: 'quit' }))],
      ...Object.keys(allProjects.projects).map((proj) => {
        let newExists = !!allProjects.newProjects[proj] ? !!allProjects.newProjects[proj].length : false;
        return [
          m.callbackButton(
            `#️⃣ ${proj} - ${allProjects.projects[proj].length} #️⃣${newExists ? ' ⚠️' : ''}`,
            JSON.stringify({ fl, sec: utils.getKeyByValue(sections, proj), type: 'sec' })
          ),
        ];
      }),
    ])
  );
};

const updateProjectsButtons = async (ctx, fl, sections, allProjects) => {
  const { curScene } = ctx.scene.state;
  let html = `
-----------------------------
<b>${curScene.val.toUpperCase()} Sections:</b>
<b>Last update: ${allProjects.date}</b>
-----------------------------
`;
  let msg_id = ctx.scene.state.messages[0].message_id;
  let chat_id = ctx.scene.state.messages[0].chat.id;
  await ctx.telegram.editMessageText(chat_id, msg_id, undefined, html, { parse_mode: 'HTML', disable_web_page_preview: true });
  await ctx.telegram.editMessageReplyMarkup(chat_id, msg_id, undefined, projectsToButtons(fl, allProjects, sections).reply_markup);
};

const pagination = (ctx, sec, curPage, pageCnt, clicked) => {
  // похоже что для button data установлен лимит строки по символам
  let { fl, sections, allProjects } = ctx.scene.state;
  let section = sections[sec];
  let newHidden = allProjects.newProjects[section] === undefined ? true : !allProjects.newProjects[section].length || clicked !== 'all';
  let newResetHidden = allProjects.newProjects[section] === undefined ? true : !allProjects.newProjects[section].length;
  let allHidden = allProjects.newProjects[section] === undefined ? true : !allProjects.newProjects[section].length || clicked === 'all';

  return Extra.HTML().markup((m) =>
    m.inlineKeyboard([
      [
        m.callbackButton(`⬅️`, JSON.stringify({ fl, sec, type: 'prev', cnt: pageCnt })),
        m.callbackButton(`${curPage + 1}/${pageCnt}`, JSON.stringify({ fl, sec, type: 'cnt' })),
        m.callbackButton(`all`, JSON.stringify({ fl, sec, type: 'all' }), allHidden),
        m.callbackButton(`new`, JSON.stringify({ fl, sec, type: 'new' }), newHidden),
        m.callbackButton(`reset`, JSON.stringify({ fl, sec, type: 'resnew' }), newResetHidden),
        m.callbackButton(`➡️`, JSON.stringify({ fl, sec, type: 'next', cnt: pageCnt })),
      ],
    ])
  );
};

const paginationController = async (ctx, sec, curPage, update, clicked = 'all') => {
  let { fl, sections, allProjects, curScene } = ctx.scene.state;
  let { projects, newProjects } = allProjects;
  let prjcs = clicked === 'all' ? projects : newProjects;
  let section = sections[sec];
  let cardsPerPage = 3;
  let pageCnt = Math.ceil(prjcs[section].length / cardsPerPage);
  let start = curPage * cardsPerPage;
  let end = start + cardsPerPage;
  let filteredProjects = prjcs[section].slice(start, end);

  let html = `<b>${curScene.val.toUpperCase()} <u>${section}</u> section - ${
    clicked === 'all' ? '<u>All Projects:</u>' : '<u>New Projects:</u>'
  }</b>`;

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
      reply_markup: pagination(ctx, sec, curPage, pageCnt, clicked).reply_markup,
      disable_web_page_preview: true,
    });
    ctx.scene.state.messages.push(response);
  } else {
    let msg_id = ctx.scene.state.messages[1].message_id;
    let chat_id = ctx.scene.state.messages[1].chat.id;
    await ctx.telegram.editMessageText(chat_id, msg_id, undefined, html, { parse_mode: 'HTML', disable_web_page_preview: true });
    await ctx.telegram.editMessageReplyMarkup(chat_id, msg_id, undefined, pagination(ctx, sec, curPage, pageCnt, clicked).reply_markup);
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
    this.curProjects = 'all';
    this.curPage = 0;
    this.curPageAll = 0;
    this.curPageNew = 0;
    this.ctx = null;
  }
  newProjectsExists = async () => {
    const { fl, sections, allProjects } = this.ctx.scene.state;

    await updateProjectsButtons(this.ctx, fl, sections, allProjects);
    if (this.curSec !== null) {
      await paginationController(this.ctx, this.curSec, this.curPage, true);
    }
  };
  freelanceScene() {
    const freelance = new Scene('freelance');
    freelance
      .enter(async (ctx) => {
        this.ctx = ctx;
        const { fl, allProjects, sections, curScene, eventEmitter } = ctx.scene.state;

        let html = `
-----------------------------
<b>${curScene.val.toUpperCase()} Sections:</b>
<b><u>Last update: ${allProjects.date}</u></b>
-----------------------------
`;

        let response = await ctx.replyWithHTML(html, projectsToButtons(fl, allProjects, sections));

        this.messages.push(response);
        ctx.scene.state.messages = this.messages;

        eventEmitter.on('new-projects', this.newProjectsExists);
      })
      .leave(sceneCleaner());

    freelance.on('callback_query', async (ctx) => {
      const { fl, sections, curScene, allProjects, eventEmitter } = ctx.scene.state;
      let { type, sec, cnt } = JSON.parse(ctx.callbackQuery.data);

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

          await paginationController(ctx, sec, this.curPage, update);
          await ctx.answerCbQuery(`${sections[sec]} section opened.`);
          this.curSec = sec;
          break;
        case 'prev':
          if (this.curPage <= 0) {
            await ctx.answerCbQuery('You are on first page.');
          } else {
            this.curProjects === 'all' ? this.curPageAll-- : this.curPageNew--;
            this.curPage--;
            await paginationController(ctx, sec, this.curPage, true, this.curProjects);
          }
          break;
        case 'next':
          if (this.curPage >= cnt - 1) {
            await ctx.answerCbQuery('You are on last page.');
          } else {
            this.curProjects === 'all' ? this.curPageAll++ : this.curPageNew++;
            this.curPage++;
            await paginationController(ctx, sec, this.curPage, true, this.curProjects);
          }
          break;
        case 'cnt':
          await ctx.answerCbQuery('current page/total pages');
          break;
        case 'all':
          this.curProjects = 'all';
          this.curPage = this.curPageAll;
          await paginationController(ctx, sec, this.curPage, true);
          break;
        case 'new':
          this.curProjects = 'new';
          this.curPage = this.curPageNew;
          await paginationController(ctx, sec, this.curPage, true, 'new');
          break;
        case 'resnew':
          let section = sections[this.curSec];
          while (allProjects.newProjects[section].length) {
            allProjects.newProjects[section].pop();
          }

          let newExists = Object.keys(allProjects.newProjects).some((proj) => allProjects.newProjects[proj].length > 0);
          if (!newExists) eventEmitter.emit('update-freelance-btns');

          this.curProjects = 'all';
          this.curPage = this.curPageAll;
          await updateProjectsButtons(ctx, fl, sections, allProjects);
          await paginationController(ctx, sec, this.curPage, true);
          break;
        case 'quit':
          await ctx.answerCbQuery(`You are in main scene.`);
          await ctx.scene.leave();
          this.messages = [];
          this.curPage = 0;
          this.curPageAll = 0;
          this.curPageNew = 0;
          this.curProjects = 'all';
          this.curSec = null;
          this.ctx = null;
          curScene.val = null;
          eventEmitter.off('new-projects', this.newProjectsExists);
          break;
      }
    });

    return freelance;
  }
}

module.exports = FreelanceScenes;
