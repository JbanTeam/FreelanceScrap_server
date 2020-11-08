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

const axiosInstance = axios.create({ baseURL: process.env.BASE_URL });
let allProjects = {
  weblancerProjects: {
    projects: {},
    newProjects: {},
    newProjectsAll: {},
  },
  flhuntProjects: {
    projects: {},
    newProjects: {},
    newProjectsAll: {},
  },
  flhabrProjects: {
    projects: {},
    newProjects: {},
    newProjectsAll: {},
  },
  freelanceruProjects: {
    projects: {},
    newProjects: {},
    newProjectsAll: {},
  },
  flruProjects: {
    projects: {},
    newProjects: {},
    newProjectsAll: {},
  },
};

const freelanceArr = {
  wb: {
    title: 'Weblancer',
    isl: false,
    timeout: null,
    firstLoad: true,
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
    firstLoad: true,
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
    firstLoad: true,
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
    firstLoad: true,
    timeout: null,
    sec: {
      wp: 'webprog',
      pi: 'prog&it',
    },
  },
  fl: {
    title: 'Flru',
    isl: false,
    firstLoad: true,
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

// формируем меню кнопок
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

// записываем объекты проектов
const setProjects = (flLower, arrName, projects, newPrjcts, deleted) => {
  allProjects[`${flLower}Projects`].projects[arrName] = projects.map((obj) => Object.assign({}, obj));
  let newExists = false;
  // newPrjcts появляются, если на сервере нет файла db/*.json или он пуст
  if (newPrjcts !== null) {
    let newProjects = allProjects[`${flLower}Projects`].newProjects;
    let newProjectsAll = allProjects[`${flLower}Projects`].newProjectsAll;

    newProjects[arrName] = newPrjcts.map((proj) => Object.assign({}, proj));
    newProjectsAll[arrName] = newPrjcts.map((proj) => proj.link);
    newExists = true;
    // если есть новые, то добавляем их к основным
    addToProjects(flLower, arrName, newPrjcts, deleted);
  }
  // возвращаем флаг "есть ли новые проекты"
  return newExists;
};

// добавляем новые проекты в объект newProjects и к основным проектам, удаляем из основных проектов те, которых больше нет на бирже
const addNewProjects = (flLower, arrName, projects, deleted) => {
  let newExists = false;
  if (projects.length) {
    let newProjects = allProjects[`${flLower}Projects`].newProjects;
    let newProjectsAll = allProjects[`${flLower}Projects`].newProjectsAll;

    if (newProjects[arrName] === undefined) {
      newProjects[arrName] = projects.map((proj) => Object.assign({}, proj));
      newProjectsAll[arrName] = projects.map((proj) => proj.link);
      newExists = true;
    } else {
      projects = projects.filter((proj) => newProjectsAll[arrName].indexOf(proj.link) === -1);
      if (projects.length) {
        newProjectsAll[arrName] = [...projects.map((proj) => proj.link), ...newProjectsAll[arrName]];
        newProjects[arrName] = [...projects.map((obj) => Object.assign({}, obj)), ...newProjects[arrName].map((obj) => Object.assign({}, obj))];
        newExists = true;
      }
    }
  }
  // если есть новые, то добавляем их к основным
  addToProjects(flLower, arrName, projects, deleted);

  // возвращаем флаг "есть ли новые проекты"
  return newExists;
};

// удаляем все новые проекты(ссылки на них) из массива соответствующего раздела объекта newProjectsAll если в массиве соответсвующего раздела объекта newProjects нет проектов, и оставляем те ссылки, которые имеются в массиве соответсвующего раздела объектв newProjects
const resetNewProjectsAll = (flLower, arrName) => {
  let newProjects = allProjects[`${flLower}Projects`].newProjects;
  let newProjectsAll = allProjects[`${flLower}Projects`].newProjectsAll;

  if (newProjects[arrName] !== undefined) {
    newProjects[arrName].length ? (newProjectsAll[arrName] = newProjects[arrName].map((proj) => proj.link)) : (newProjectsAll[arrName] = []);
  }
};

// добавляем новые проекты к основным, удаляем те которых больше нет на бирже
const addToProjects = (flLower, arrName, projects, deleted) => {
  if (deleted && deleted.length) {
    allProjects[`${flLower}Projects`].projects[arrName] = allProjects[`${flLower}Projects`].projects[arrName].filter((proj) => {
      return deleted.indexOf(proj.link) === -1;
    });
  }

  if (projects && projects.length) {
    if (allProjects[`${flLower}Projects`].projects[arrName] === undefined) {
      allProjects[`${flLower}Projects`].projects[arrName] = projects.map((obj) => Object.assign({}, obj));
    } else {
      allProjects[`${flLower}Projects`].projects[arrName].unshift(...projects.map((obj) => Object.assign({}, obj)));
    }
  }
};

// начинаем загрузку
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
    return await axiosInstance.get(`/api/${flLower}-start${type}`);
    // console.log(run.data);
  } catch (error) {
    console.log(error);
  }
};

// читаем проекты
const projectsRead = async (ctx, fl, flLower, firstTime) => {
  // в query пробрасываем firstTime - первый раз клиент читает проекты или нет
  let response = await axiosInstance.get(`/api/${flLower}-projects?cnt=0&firstTime=${firstTime}`);

  let cnt = response.data.cnt;
  let date = response.data.date;
  let newExists = false;

  allProjects[`${flLower}Projects`].date = date;

  while (cnt !== 0) {
    let projects = await axiosInstance.get(`/api/${flLower}-projects?cnt=${cnt}&firstTime=${firstTime}`);
    cnt = projects.data.cnt;
    delete projects.data.cnt;

    let arrName = projects.data.arrName;

    // если первый раз
    if (firstTime) {
      // записываем проекты
      let res = setProjects(flLower, arrName, projects.data[arrName], projects.data.newProjects, projects.data.deleted);
      // присутствуют ли новые проекты
      if (!newExists) newExists = res;
    } else {
      // если не первый раз
      if (projects.data[arrName].length || projects.data.deleted.length) {
        // если есть новые проекты или удаленные
        let res = addNewProjects(flLower, arrName, projects.data[arrName], projects.data.deleted);
        if (!newExists) newExists = res;
      } else {
        // если нет новых или удаленных, смотрим флаг не прпоизошла ли очистка всех новых проектов на сервере, если да, то чистим и тут
        if (projects.data.newProjectsCleaned) resetNewProjectsAll(flLower, arrName);
      }
    }
  }

  // если новые присутствуют, то обновляем кнопки и отсылаем сообщение о том, что новые есть
  if (newExists) {
    await updateFreelanceBtns(ctx);
    await ctx.telegram.sendMessage(chat_id, `${flLower.toUpperCase()} has new projects! 🔥🔥🔥`);

    // пробрасываем событие в tg-scene.js о том что есть новые
    eventEmitter.emit('new-projects');
  }

  // запускаем таймер для обновления информации о новых проектах на соответсвующей бирже
  freelanceArr[fl].timeout = setTimeout(async () => {
    await projectsRead(ctx, fl, flLower, freelanceArr[fl].firstLoad);
  }, 60000 * 3);
};

// прерываем загрузку на сервере
const abortLoading = async (ctx, fl) => {
  try {
    let flLower = freelanceArr[fl].title.toLowerCase();
    await axiosInstance.get(`/api/${flLower}-abort`);

    freelanceArr[fl].isl = false;
    clearTimeout(freelanceArr[fl].timeout);
    // обновляем кнопки
    await updateFreelanceBtns(ctx);
    // отсылаем сообщение о том что загрузка прервана
    await ctx.answerCbQuery(`${flLower.toUpperCase()} loading aborted.`);
  } catch (error) {
    freelanceArr[fl].isl = false;
    clearTimeout(freelanceArr[fl].timeout);
    console.log(error);
  }
};

// обновляем кнопки
const updateFreelanceBtns = async (ctx) => {
  let menuObj = menu(freelanceArr);
  // обновляем существующее меню
  await ctx.telegram.editMessageText(chat_id, menu_msg_id, undefined, menuObj.inProgress, { parse_mode: 'HTML', disable_web_page_preview: true });
  await ctx.telegram.editMessageReplyMarkup(chat_id, menu_msg_id, undefined, menuObj.extra.reply_markup);
};

// клик по кнопке соответсвующей биржи
const freelanceBtnClick = async (ctx, fl, isLoading) => {
  if (!isLoading) freelanceArr[fl].isl = true;

  let flLower = freelanceArr[fl].title.toLowerCase();

  // обновляем меню кнопок
  await updateFreelanceBtns(ctx);

  // если не идет загрузка соответствующей биржи, то запускаем
  if (!isLoading) {
    let response = await startLoading(flLower);
    if (response.data.start) {
      await ctx.replyWithHTML(`Starts loading from <u><b>**${flLower.toUpperCase()}**</b></u> ⏳`);
      await projectsRead(ctx, fl, flLower, freelanceArr[fl].firstLoad);
      freelanceArr[fl].firstLoad = false;
    }
  } else {
    // если идет загрузка в данный момент, то просто выводим имеющиеся проекты
    curScene.val = flLower;

    await ctx.scene.enter(`freelance`, {
      fl,
      allProjects: allProjects[`${flLower}Projects`],
      sections: freelanceArr[fl].sec,
      curScene,
      eventEmitter,
    });
    await ctx.answerCbQuery(`You are in ${flLower.toUpperCase()} scene.`);
  }
};

// ? listeners****************************************************
bot.start(async (ctx) => {
  // при команде /start отправляем клиенту меню, сохраняем id чата и сообщения menu, для будущего обновления
  let menuObj = menu(freelanceArr);

  let response = await ctx.replyWithHTML(menuObj.inProgress, menuObj.extra);
  menu_msg_id = response.message_id;
  chat_id = response.chat.id;

  // вешаем событие на обновление кнопок меню
  eventEmitter.on('update-freelance-btns', async () => {
    await updateFreelanceBtns(ctx);
  });
});

bot.on('callback_query', async (ctx) => {
  // события при нажатии на кнопки
  let { fl, isl, type } = JSON.parse(ctx.callbackQuery.data);

  // если текущая сцена не равна null, то выводим сообщение(чтобы при нажатии на кнопки главной сцены ничего не происходило, если мы находится не на главной сцене)
  if (curScene.val !== null) {
    await ctx.answerCbQuery('You are not on main scene. First quit from freelance scene.');
    return;
  }

  // нажатие на кнопки
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
