const axios = require('axios');
const { Telegraf } = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');

const EventEmitter = require('events');

const FreelanceScenes = require('./tg-scenes');
const scenes = new FreelanceScenes();
const freelanceScene = scenes.freelanceScene();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const stage = new Stage([freelanceScene]);
const eventEmitter = new EventEmitter();

bot.use(session());
bot.use(stage.middleware());

let allProjects = {
  weblancerProjects: {
    projects: {},
    newProjects: {},
  },
  flhuntProjects: {
    projects: {},
    newProjects: {},
  },
  flhabrProjects: {
    projects: {},
    newProjects: {},
  },
  freelanceruProjects: {
    projects: {},
    newProjects: {},
  },
  flruProjects: {
    projects: {},
    newProjects: {},
  },
};

const freelanceArr = {
  wb: {
    title: 'Weblancer',
    isl: false,
    timeout: null,
    sec: {
      wp: 'webprog',
      ht: 'html',
      wh: 'wholesite',
      cm: 'cms',
      is: 'inetshop',
    },
  },
  fh: {
    title: 'Flhunt',
    isl: false,
    timeout: null,
    sec: {
      ht: 'html',
      js: 'javascript',
      nd: 'nodejs',
      wp: 'webprog',
      pr: 'parsing',
    },
  },
  fb: {
    title: 'Flhabr',
    isl: false,
    timeout: null,
    sec: {
      wh: 'wholesite',
      fe: 'frontend',
      pr: 'parsing&bots',
      sc: 'scripts',
      be: 'backend',
    },
  },
  fr: {
    title: 'Freelanceru',
    isl: false,
    timeout: null,
    sec: {
      wp: 'webprog',
      pi: 'prog&it',
    },
  },
  fl: {
    title: 'Flru',
    isl: false,
    timeout: null,
    sec: {
      wp: 'webprog',
      ht: 'html',
      wh: 'wholesite',
      cm: 'cms',
      is: 'inetshop',
    },
  },
};

let menu_msg_id;
let chat_id;

let curScene = {
  val: null,
};

let firstLoad = true;

const menu = (freelanceArr) => {
  let html = `
  <b>To start loading click on button 🔥🔥🔥🔥🔥🔥🔥</b>
  `;

  let someInProgress = Object.keys(freelanceArr).some((fl) => freelanceArr[fl].isl);

  if (!someInProgress) {
    html += `
No stock market in progress.
`;
  } else {
    Object.keys(freelanceArr).forEach((fl) => {
      if (freelanceArr[fl].isl) {
        html += `
<b>${freelanceArr[fl].title.toUpperCase()} in progress ✅</b>`;
      }
    });
  }

  return {
    // extra1: {
    //   reply_markup: {
    //     inline_keyboard: [
    //       [
    //         { text: 'Yo', callback_data: 'dl' },
    //         { text: 'Yoy', callback_data: 'dll' },
    //       ],
    //       [{ text: 'Yo', callback_data: 'dl' }],
    //     ],
    //   },
    // },
    extra: Extra.markup((m) =>
      m.inlineKeyboard(
        Object.keys(freelanceArr).map((fl) => {
          let flLower = freelanceArr[fl].title.toLowerCase();

          let newExists = Object.keys(allProjects[`${flLower}Projects`].newProjects).some(
            (proj) => allProjects[`${flLower}Projects`].newProjects[proj].length > 0
          );

          if (!freelanceArr[fl].isl) {
            return [m.callbackButton(`${freelanceArr[fl].title} ▶️${newExists ? ' ⚠️' : ''}`, JSON.stringify({ fl, isl: 0, type: 'fl' }))];
          } else {
            return [
              m.callbackButton(`${freelanceArr[fl].title} 🔽${newExists ? ' ⚠️' : ''}`, JSON.stringify({ fl, isl: 1, type: 'fl' })),
              m.callbackButton('❌', JSON.stringify({ fl, type: 'abort' })),
            ];
          }
        })
      )
    ),
    inProgress: html,
  };
};

const setProjects = (flLower, arrName, projects) => {
  allProjects[`${flLower}Projects`].projects[arrName] = projects.map((obj) => Object.assign({}, obj));
};

const addNewProjects = (flLower, arrName, projects) => {
  // console.log('projects', projects.length);

  let newProjects = allProjects[`${flLower}Projects`].newProjects;

  if (newProjects[arrName] === undefined) {
    newProjects[arrName] = projects.map((proj) => Object.assign({}, proj));
  } else {
    newProjects[arrName] = [...newProjects[proj].map((obj) => Object.assign({}, obj)), ...projects[proj].map((obj) => Object.assign({}, obj))];
  }
};

const addToProjects = (flLower, arrName, projects, deleted) => {
  // console.log('projects', projects.length);
  // console.log('deleted', deleted.length);

  if (deleted.length) {
    allProjects[`${flLower}Projects`].projects[arrName] = allProjects[`${flLower}Projects`].projects[arrName].filter((proj) => {
      return deleted.indexOf(proj.link) === -1;
    });
  }

  if (projects.length) {
    allProjects[`${flLower}Projects`].projects[arrName].unshift(...projects.map((obj) => Object.assign({}, obj)));
  }
};

const startLoading = async (flLower) => {
  let type;
  switch (flLower) {
    case 'weblancer':
      type = '?type=cheerio';
      break;
    case 'flhunt':
      type = '?type=cheerio';
      break;
    case 'flhabr':
      type = '';
      break;
    case 'freelanceru':
      type = '';
      break;
    case 'flru':
      type = '';
      break;
  }

  try {
    return await axios.get(`http://localhost:5000/api/${flLower}-start${type}`);
    // console.log(run.data);
  } catch (error) {
    console.log(error);
  }
};

const projectsRead = async (ctx, fl, flLower, firstTime) => {
  let response = await axios.get(`http://localhost:5000/api/${flLower}-projects?cnt=0&firstTime=${firstTime}`);

  let cnt = response.data.cnt;
  let date = response.data.date;
  let newExists = false;

  allProjects[`${flLower}Projects`].date = date;

  while (cnt !== 0) {
    let projects = await axios.get(`http://localhost:5000/api/${flLower}-projects?cnt=${cnt}&firstTime=${firstTime}`);
    cnt = projects.data.cnt;
    delete projects.data.cnt;

    let arrName = projects.data.arrName;

    if (firstTime) {
      setProjects(flLower, arrName, projects.data[arrName]);
    } else {
      if (projects.data[arrName].length) newExists = true;
      if (projects.data[arrName].length || projects.data.deleted.length) {
        addNewProjects(flLower, arrName, projects.data[arrName]);
        addToProjects(flLower, arrName, projects.data[arrName], projects.data.deleted);
      }
    }
  }

  if (newExists) {
    await updateFreelanceBtns(ctx);
    await ctx.telegram.sendMessage(chat_id, `${flLower.toUpperCase()} has new projects! 🔥🔥🔥`);

    eventEmitter.emit('new-projects');
  }

  freelanceArr[fl].timeout = setTimeout(async () => {
    await projectsRead(ctx, fl, flLower, firstLoad);
  }, 65000);
};

const abortLoading = async (ctx, fl) => {
  try {
    let flLower = freelanceArr[fl].title.toLowerCase();
    await axios.get(`http://localhost:5000/api/${flLower}-abort`);

    freelanceArr[fl].isl = false;
    clearTimeout(freelanceArr[fl].timeout);

    await updateFreelanceBtns(ctx);
    await ctx.answerCbQuery(`${flLower.toUpperCase()} loading aborted.`);
  } catch (error) {
    freelanceArr[fl].isl = false;
    clearTimeout(freelanceArr[fl].timeout);
    console.log(error);
  }
};

const updateFreelanceBtns = async (ctx) => {
  let menuObj = menu(freelanceArr);

  await ctx.telegram.editMessageText(chat_id, menu_msg_id, undefined, menuObj.inProgress, { parse_mode: 'HTML', disable_web_page_preview: true });
  await ctx.telegram.editMessageReplyMarkup(chat_id, menu_msg_id, undefined, menuObj.extra.reply_markup);
};

const freelanceBtnClick = async (ctx, fl, isLoading) => {
  if (!isLoading) freelanceArr[fl].isl = true;

  let flLower = freelanceArr[fl].title.toLowerCase();

  await updateFreelanceBtns(ctx);

  if (!isLoading) {
    let response = await startLoading(flLower);
    if (response.data.start) {
      await ctx.replyWithHTML(`Starts loading from <u><b>**${flLower.toUpperCase()}**</b></u> ⏳`);
      await projectsRead(ctx, fl, flLower, firstLoad);
      firstLoad = false;
    }
  }

  curScene.val = flLower;

  await ctx.scene.enter(`freelance`, {
    fl,
    allProjects: allProjects[`${flLower}Projects`],
    sections: freelanceArr[fl].sec,
    curScene,
    eventEmitter,
  });
  await ctx.answerCbQuery(`You are in ${flLower.toUpperCase()} scene.`);
};

// ? listeners****************************************************
bot.start(async (ctx) => {
  let menuObj = menu(freelanceArr);

  let response = await ctx.replyWithHTML(menuObj.inProgress, menuObj.extra);
  menu_msg_id = response.message_id;
  chat_id = response.chat.id;

  eventEmitter.on('update-freelance-btns', async () => {
    await updateFreelanceBtns(ctx);
  });
});

bot.on('callback_query', async (ctx) => {
  let { fl, isl, type } = JSON.parse(ctx.callbackQuery.data);

  if (curScene.val !== null) {
    await ctx.answerCbQuery('You are not on main scene. First quit from freelance scene.');
    return;
  }

  if (type === 'fl') {
    await freelanceBtnClick(ctx, fl, !!isl);
  } else if (type === 'abort') {
    await abortLoading(ctx, fl);
  } else {
    await ctx.answerCbQuery('Not freelance button clicked.');
  }
});

module.exports = {
  bot,
};
