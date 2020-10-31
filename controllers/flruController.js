const Nightmare = require('nightmare');
const cheerio = require('cheerio');
const moment = require('moment');

const colors = require('colors');

const utils = require('../utils');

let nightmare = Nightmare({
  // show: true,
  openDevTools: {
    mode: 'detach',
  },
  // webPreferences: {
  //   webSecurity: false,
  // },
});

let flruProjects = {
  projects: {},
  date: 'none',
};

let flruPrevProjects = {
  projects: {},
  date: 'none',
};

let newProjectsCleaned = false;
let isLoading = false;
let canLoading;

// ! ************************************************************************
// ! ************************************************************************
// fl-ru***********************************************************
async function createNewNightmare({ msg, error, aborted }) {
  if (msg) {
    console.log('message:', msg, 'err:', error);
  }
  if (aborted) {
    console.log('flru aborted load'.bgMagenta);
  }
  await nightmare.end();
  nightmare = new Nightmare({
    // show: true,
    openDevTools: {
      mode: 'detach',
    },
    // webPreferences: {
    //   webSecurity: false,
    // },
  });
}
// ? flruClickCheerio*********************************************************
async function flruClickCheerioObjects($cheerio, url) {
  let all = $cheerio('#projects-list .b-post');
  // console.log(all);

  let projects = [];

  if (all.length) {
    all.each((i, el) => {
      let fixed = $cheerio(el).hasClass('b-post_bg_ffffd4');
      let budget = $cheerio(el).find('.b-post__price').text().trim();
      let skills = null;
      let fast = $cheerio(el).find('.b-post__title > .b-pic').length ? true : false;
      let link = `${url}${$cheerio(el).find('.b-post__title .b-post__link').attr('href').trim()}`;
      let title = $cheerio(el).find('.b-post__title .b-post__link').text().trim();
      let description = $cheerio(el).find('.b-post__body .b-post__txt').text().trim();
      let bets = $cheerio(el).find('.b-post__foot > .b-post__txt > .b-post__link').text().trim();

      let timeElems = $cheerio(el)
        .find('.b-post__foot > .b-post__txt')
        .contents()
        .filter(function () {
          return this.type === 'text';
        });
      let time = '';
      timeElems.each(function () {
        time += this.data.trim();
      });

      let published = null;

      let projectObject = {
        fast,
        fixed,
        link,
        title,
        skills,
        description,
        budget,
        bets,
        time,
        published,
      };

      projects.push(projectObject);
    });
  }
  // console.log(projects);

  return projects;
}

async function flruScrapClickCheerio(section, url) {
  let resultProjects = [];

  const data = await nightmare.evaluate(() => {
    return document.body.innerHTML;
  });

  let $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

  // собираем проекты с первой страницы, мы на ней находимся
  try {
    resultProjects = [...resultProjects, ...(await flruClickCheerioObjects($, url))];
  } catch (error) {
    console.log('message', 'first page parse error', 'err', error);
  }
  // пробегаемся по оставшимся страницам и собираем проекты
  let isNextDisabled = false;
  let isNextExists = !!$('.b-pager__list').length;
  let pageCount = 1;
  if (!isNextExists) {
    console.log('next disabled', true, 'next exists', isNextExists);
    console.log(`flru ${section} - ${resultProjects.length}`.bgGreen);
    flruPrevProjects.newProjects[section] = utils.diff(flruPrevProjects.projects[section], resultProjects);
    flruPrevProjects.deleted[section] = utils.diff2(resultProjects, flruPrevProjects.projects[section]);
    flruProjects.projects[section] = resultProjects;
  }

  while (!isNextDisabled) {
    if (!canLoading) {
      return;
    }
    // тормозим цикл, если слишком много страниц
    pageCount++;
    if (pageCount > 10) break;

    isNextDisabled = $('.b-pager__list li.b-pager__item_active + li').length ? false : true;
    console.log('next disabled', isNextDisabled, 'next exists', isNextExists);

    if (!isNextExists || isNextDisabled) break;

    let nextLink = `${url}/projects${$('.b-pager__list li.b-pager__item_active + li a').attr('href')}`;
    console.log(nextLink);

    if (isNextExists && !isNextDisabled) await nightmare.goto(nextLink).wait('.b-post').wait('#pf_specs .b-ext-filter__krest').wait(1000);

    const data = await nightmare.evaluate(() => {
      return document.body.innerHTML;
    });

    $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

    try {
      resultProjects = [...resultProjects, ...(await flruClickCheerioObjects($, url))];
    } catch (error) {
      console.log('message', `${nextLink} page parse error`, 'err', error);
    }
  }

  console.log(`flru ${section} - ${resultProjects.length}`.bgGreen);
  flruPrevProjects.newProjects[section] = utils.diff(flruPrevProjects.projects[section], resultProjects);
  flruPrevProjects.deleted[section] = utils.diff2(resultProjects, flruPrevProjects.projects[section]);
  flruProjects.projects[section] = resultProjects;
}

exports.flruClickCheerio = async () => {
  const url = 'https://www.fl.ru';

  // web-programming***********************************
  try {
    await nightmare
      .goto(url + '/projects')
      .wait('#projects-list')
      .click('#comboe ~ .b-combo__arrow')
      .click('span[dbid="9"]')
      .click('a.b-button[href="javascript:void(0)"]')
      .wait(1000)
      .click('.b-buttons button.b-button')
      .wait(3000)
      .wait('.b-post');
  } catch (error) {
    await createNewNightmare({ msg: 'flru webprog section goto error', error });
    // return res.json({ error: true, message: 'flru webprog section goto error' });
  }

  try {
    await flruScrapClickCheerio('webprog', url);
  } catch (error) {
    await createNewNightmare({ msg: 'flru webprog section parse error', error });
    // return res.json({ error: true, message: 'flru webprog section parse error' });
  }

  // html*********************************************
  try {
    await nightmare
      .click('#pf_specs .b-ext-filter__krest')
      .wait('#projects-list')
      .click('#comboe ~ .b-combo__arrow')
      .click('span[dbid="8"]')
      .click('a.b-button[href="javascript:void(0)"]')
      .wait(1000)
      .click('.b-buttons button.b-button')
      .wait(3000)
      .wait('.b-post');
  } catch (error) {
    await createNewNightmare({ msg: 'flru html section goto error', error });
    // return res.json({ error: true, message: 'flru html section goto error' });
  }

  try {
    await flruScrapClickCheerio('html', url);
  } catch (error) {
    await createNewNightmare({ msg: 'flru html section parse error', error });
    // return res.json({ error: true, message: 'flru html section parse error' });
  }

  // сайт под ключ*********************************************
  try {
    await nightmare
      .click('#pf_specs .b-ext-filter__krest')
      .wait('#projects-list')
      .click('#comboe ~ .b-combo__arrow')
      .click('span[dbid="27"]')
      .click('a.b-button[href="javascript:void(0)"]')
      .wait(1000)
      .click('.b-buttons button.b-button')
      .wait(3000)
      .wait('.b-post');
  } catch (error) {
    await createNewNightmare({ msg: 'flru wholesite section goto error', error });
    // return res.json({ error: true, message: 'flru wholesite section goto error' });
  }

  try {
    await flruScrapClickCheerio('wholesite', url);
  } catch (error) {
    await createNewNightmare({ msg: 'flru wholesite section parse error', error });
    // return res.json({ error: true, message: 'flru wholesite section parse error' });
  }

  // Cms*********************************************
  try {
    await nightmare
      .click('#pf_specs .b-ext-filter__krest')
      .wait('#projects-list')
      .click('#comboe ~ .b-combo__arrow')
      .click('span[dbid="86"]')
      .click('a.b-button[href="javascript:void(0)"]')
      .wait(1000)
      .click('.b-buttons button.b-button')
      .wait(3000)
      .wait('.b-post');
  } catch (error) {
    await createNewNightmare({ msg: 'flru cms section goto error', error });
    // return res.json({ error: true, message: 'flru cms section goto error' });
  }

  try {
    await flruScrapClickCheerio('cms', url);
  } catch (error) {
    await createNewNightmare({ msg: 'flru cms section parse error', error });
    // return res.json({ error: true, message: 'flru cms section parse error' });
  }

  // интернет магазины*********************************************
  try {
    await nightmare
      .click('#pf_specs .b-ext-filter__krest')
      .wait('#projects-list')
      .click('#comboe ~ .b-combo__arrow')
      .click('span[dbid="217"]')
      .click('a.b-button[href="javascript:void(0)"]')
      .wait(1000)
      .click('.b-buttons button.b-button')
      .wait(3000)
      .wait('.b-post');
  } catch (error) {
    await createNewNightmare({ msg: 'flru inetshop section goto error', error });
    // return res.json({ error: true, message: 'flru inetshop section goto error' });
  }

  try {
    await flruScrapClickCheerio('inetshop', url);
  } catch (error) {
    await createNewNightmare({ msg: 'flru inetshop section parse error', error });
    // return res.json({ error: true, message: 'flru inetshop section parse error' });
  }

  flruProjects['date'] = moment().format('DD-MM-YYYY / HH:mm:ss');
  await createNewNightmare({});
  // utils.writeFileSync('../client/src/assets/flruProjects.json', JSON.stringify(flruProjects));
};

// ? flruStart*************************************************************************
exports.flruProjectsRead = async (req, res, next) => {
  if (+req.query.cnt === 0) return res.json({ cnt: Object.keys(flruPrevProjects.projects).length, date: flruPrevProjects.date });
  let firstTime = req.query.firstTime;

  let cnt = +req.query.cnt;
  let length = Object.keys(flruPrevProjects.projects).length;
  let arr = Object.keys(flruPrevProjects.projects)[length - cnt];

  let projectsArr;
  let deleted = null;
  if (firstTime === 'true') {
    projectsArr = flruPrevProjects.projects[arr];
  } else {
    projectsArr = flruPrevProjects.newProjects[arr];
    deleted = flruPrevProjects.deleted[arr];
    if (projectsArr.length) newProjectsCleaned = false;
    console.log('projects', projectsArr.length);
    console.log('deleted', deleted.length);
  }

  res.json({ cnt: cnt - 1, [arr]: projectsArr, arrName: arr, deleted, newProjectsCleaned });
};

let timeout;
let firstTimeReadProjects = true;
exports.flruStart = async (req, res, next) => {
  canLoading = true;

  if (firstTimeReadProjects) {
    let fileExists = utils.fileExists('../client/src/assets/flruProjects.json');
    if (fileExists) {
      let projects = JSON.parse(utils.readFileSync('../client/src/assets/flruProjects.json'));
      if (projects.projects === undefined) {
        res.json({ start: true, message: 'file is empty' });
      } else {
        flruPrevProjects = utils.deepCloneObject(projects);
        flruPrevProjects.newProjects = {};
        flruPrevProjects.deleted = {};
        Object.keys(flruPrevProjects.projects).forEach((proj) => {
          flruPrevProjects.newProjects[proj] = [];
          flruPrevProjects.deleted[proj] = [];
        });
        res.json({ start: true });
      }
    } else {
      res.json({ start: true, message: 'file not exists' });
    }
    isLoading = true;
    firstTimeReadProjects = false;
  } else {
    if (isLoading) {
      return res.json({ start: true });
    }
    isLoading = true;
    res.json({ start: true });
  }

  let cnt = 0;

  const recursiveLoad = async () => {
    console.log('flru start load'.bgYellow);
    try {
      await this.flruClickCheerio().then(() => {
        if (!canLoading) return;
        cnt++;
        if (cnt > 1) {
          cnt = 0;
          mergeProjects();
        }
        console.log('flru end load'.bgMagenta);
        timeout = setTimeout(recursiveLoad, 60000 * 5);
      });
    } catch (error) {
      clearTimeout(timeout);
    }
  };

  recursiveLoad();
};

const mergeProjects = () => {
  Object.keys(flruPrevProjects.newProjects).forEach((proj) => {
    while (flruPrevProjects.newProjects[proj].length) {
      flruPrevProjects.newProjects[proj].pop();
    }
  });
  Object.keys(flruPrevProjects.deleted).forEach((proj) => {
    while (flruPrevProjects.deleted[proj].length) {
      flruPrevProjects.deleted[proj].pop();
    }
  });

  flruPrevProjects.date = flruProjects.date;
  flruPrevProjects.projects = utils.deepCloneObject(flruProjects.projects);

  newProjectsCleaned = true;
};
// ? flruAbort********************************************************************************
exports.flruAbort = async (req, res, next) => {
  clearTimeout(timeout);
  isLoading = false;
  canLoading = false;
  await createNewNightmare({ aborted: true });

  res.json({ aborted: true });
};
