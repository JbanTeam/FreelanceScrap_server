const axios = require('axios');
const { Telegraf } = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');

const FreelanceScenes = require('./tg-scenes');
const scenes = new FreelanceScenes();
const freelanceScene = scenes.freelanceScene();
const utils = require('../utils');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

const stage = new Stage([freelanceScene]);
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

let curScene = {
  val: null,
};

const freelanceArr = {
  wb: {
    title: 'Weblancer',
    isl: false,
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
    sec: {
      wp: 'webprog',
      pi: 'prog&it',
    },
  },
  fl: {
    title: 'Flru',
    isl: false,
    sec: {
      wp: 'webprog',
      ht: 'html',
      wh: 'wholesite',
      cm: 'cms',
      is: 'inetshop',
    },
  },
};

const menu = (freelanceArr) => {
  let html = `
  <b>To start loading click on button 🔥</b>
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
    extra: Extra.markup((m) =>
      m.inlineKeyboard(
        Object.keys(freelanceArr).map((fl) => {
          if (!freelanceArr[fl].isl) {
            return [m.callbackButton(freelanceArr[fl].title + ' ▶️', JSON.stringify({ fl, isl: 0, type: 'fl' }))];
          } else {
            return [
              m.callbackButton(freelanceArr[fl].title + ' 🔽', JSON.stringify({ fl, isl: 1, type: 'fl' })),
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
  console.log('projects', projects.length);

  let newProjects = allProjects[`${flLower}Projects`].newProjects;

  if (newProjects[arrName] === undefined) {
    newProjects[arrName] = projects.map((proj) => Object.assign({}, proj));
  } else {
    newProjects[arrName] = [...newProjects[proj].map((obj) => Object.assign({}, obj)), ...projects[proj].map((obj) => Object.assign({}, obj))];
  }
};

const addToProjects = (flLower, arrName, projects, deleted) => {
  console.log('projects', projects.length);
  console.log('deleted', deleted.length);

  if (deleted.length) {
    allProjects[`${flLower}Projects`].projects[arrName] = allProjects[`${flLower}Projects`].projects[arrName].filter((proj) => {
      return deleted.indexOf(proj.link) === -1;
    });
  }

  if (projects.length) {
    allProjects[`${flLower}Projects`].projects[arrName].unshift(...projects.map((obj) => Object.assign({}, obj)));
  }
};

const projectsRead = async (flLower, firstTime) => {
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

  let run = await axios.get(`http://localhost:5000/api/${flLower}-start${type}`);

  if (run.data.start) {
    let response = await axios.get(`http://localhost:5000/api/${flLower}-projects?cnt=0&firstTime=${firstTime}`);

    let cnt = response.data.cnt;
    let date = response.data.date;
    let newExists = false;

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
      // TODO: notification
    }
  }
};

const abortLoading = async (ctx, fl) => {
  try {
    let flLower = freelanceArr[fl].title.toLowerCase();
    await axios.get(`http://localhost:5000/api/${flLower}-abort`);

    freelanceArr[fl].isl = false;

    let menuObj = menu(freelanceArr);

    await ctx.editMessageText(menuObj.inProgress, { parse_mode: 'HTML' });
    await ctx.editMessageReplyMarkup(menuObj.extra.reply_markup);
    await ctx.answerCbQuery(`${flLower.toUpperCase()} loading aborted.`);
  } catch (error) {
    console.log(error);
  }
};

const freelanceBtnClick = async (ctx, fl, isLoading, abort) => {
  if (!isLoading) freelanceArr[fl].isl = true;

  let flLower = freelanceArr[fl].title.toLowerCase();
  let menuObj = menu(freelanceArr);

  await ctx.editMessageText(menuObj.inProgress, { parse_mode: 'HTML' });
  await ctx.editMessageReplyMarkup(menuObj.extra.reply_markup);

  if (!isLoading) {
    await ctx.replyWithHTML(`Starts loading from <u><b>**${flLower.toUpperCase()}**</b></u> ⏳`);
  }

  await projectsRead(flLower, true);

  curScene.val = flLower;

  await ctx.scene.enter(`freelance`, { fl, projects: allProjects[`${flLower}Projects`].projects, sections: freelanceArr[fl].sec, curScene });
  await ctx.answerCbQuery(`You are in ${flLower.toUpperCase()} scene.`);
};

// ? listeners****************************************************
bot.start(async (ctx) => {
  let menuObj = menu(freelanceArr);

  await ctx.replyWithHTML(menuObj.inProgress, menuObj.extra);
});

bot.on('callback_query', async (ctx) => {
  let { fl, isl, type } = JSON.parse(ctx.callbackQuery.data);

  let flLower = freelanceArr[fl].title.toLowerCase();

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
