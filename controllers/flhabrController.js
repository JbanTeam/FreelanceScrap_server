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

let flhabrProjects = {
  projects: {},
  date: 'none',
};

let flhabrPrevProjects = {
  projects: {},
  date: 'none',
};

let isLoading = false;
let canLoading;

// ! *********************************************************************************
// freelance-habr********************************************************************************
// freelance-habr********************************************************************************
async function createNewNightmare({ msg, error, aborted }) {
  if (msg) {
    console.log('message:', msg, 'err:', error);
  }
  if (aborted) {
    console.log('flhabr aborted load'.bgMagenta);
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
// ? flhabrLinksCheerio*************************************************************************
async function flhabrScrapLinksCheerio($cheerio, url) {
  let all = $cheerio('#tasks_list .content-list__item');
  // console.log(all);

  let projects = [];

  if (all.length) {
    all.each((i, el) => {
      let budget = $cheerio(el).find('.task__price .count').length
        ? $cheerio(el).find('.task__price .count').text()
        : $cheerio(el).find('.task__price .negotiated_price').text();

      let skillsEl = $cheerio(el).find('.task__tags .tags .tags__item > a');
      let skills = skillsEl.length
        ? skillsEl
            .map((i, el) => $cheerio(el).text())
            .get()
            .join(', ')
        : null;
      // console.log(skillsDiv);

      let fixed = $cheerio(el).hasClass('content-list__item_marked');
      let link = `${url}${$cheerio(el).find('.task__title a').attr('href')}`;
      let title = $cheerio(el).find('.task__title').attr('title');
      let description = null;
      let bets = $cheerio(el).find('.task__params .params__responses .params__count').text().trim();
      let time = $cheerio(el).find('.task__params .params__published-at > span').text();
      let published = null;

      let projectObject = {
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
exports.flhabrLinksCheerio = async (req, res, next) => {
  let resultProjects = [];
  const url = 'https://freelance.habr.com';
  const categoryLinks = [
    {
      title: 'wholesite',
      link: 'https://freelance.habr.com/tasks?categories=development_all_inclusive',
    },
    {
      title: 'frontend',
      link: 'https://freelance.habr.com/tasks?categories=development_frontend',
    },
    {
      title: 'parsing&bots',
      link: 'https://freelance.habr.com/tasks?categories=development_bots',
    },
    {
      title: 'scripts',
      link: 'https://freelance.habr.com/tasks?categories=development_scripts',
    },
    {
      title: 'backend',
      link: 'https://freelance.habr.com/tasks?categories=development_backend',
    },
  ];

  try {
    // пробегаемся по всем страницам разделам
    for (let i = 0; i < categoryLinks.length; i++) {
      if (!canLoading) return;

      await nightmare.goto(categoryLinks[i].link).wait('#tasks_list');

      const data = await nightmare.evaluate(() => {
        return document.body.innerHTML;
      });

      $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

      // собираем проекты с первой страницы, мы на ней находимся
      try {
        resultProjects = [...resultProjects, ...(await flhabrScrapLinksCheerio($, url))];
      } catch (error) {
        await createNewNightmare({ msg: `flhabr 1 page of ${categoryLinks[i]} parse error`, error });
        // return res.json({ error: true, message: `flhabr 1 page of ${categoryLinks[i]} parse error` });
      }
      // console.log(resultProjects);

      // пробегаемся по оставшимся страницам и собираем проекты
      let isNextDisabled = false;
      let isNextExists = !!$('.pagination').length;
      if (!isNextExists) {
        console.log('next disabled', true, 'next exists', isNextExists);
        console.log(`flhabr ${categoryLinks[i].title} - ${resultProjects.length}`.bgGreen);
        flhabrProjects.projects[categoryLinks[i].title] = resultProjects;
        resultProjects = [];
        continue;
      }

      while (!isNextDisabled) {
        if (!canLoading) return;

        isNextDisabled = $('.pagination em.current + a').length ? false : true;
        console.log('next disabled', isNextDisabled, 'next exists', isNextExists);

        if (isNextDisabled) break;

        let nextLink = `${url}${$('.pagination em.current + a').attr('href')}`;
        console.log(nextLink);

        if (isNextExists && !isNextDisabled) await nightmare.goto(nextLink).wait('#tasks_list').wait(1000);

        const data = await nightmare.evaluate(() => {
          return document.body.innerHTML;
        });

        $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

        try {
          resultProjects = [...resultProjects, ...(await flhabrScrapLinksCheerio($, url))];
        } catch (error) {
          await createNewNightmare({ msg: `flhabr ${nextLink} of ${categoryLinks[i]} parse error`, error });
          // return res.json({ error: true, message: `flhabr ${nextLink} of ${categoryLinks[i]} parse error` });
        }
      }

      console.log(`flhabr ${categoryLinks[i].title} - ${resultProjects.length}`.bgGreen);
      flhabrProjects.projects[categoryLinks[i].title] = resultProjects;
      resultProjects = [];
    }
  } catch (error) {
    await createNewNightmare({ msg: `flhabr category links goto error`, error });
    // return res.json({ error: true, message: `flhabr category links goto error` });
  }

  flhabrProjects['date'] = moment().format('DD-MM-YYYY / HH:mm:ss');
  await createNewNightmare();
  utils.writeFileSync('../client/src/assets/flhabrProjects.json', JSON.stringify(flhabrProjects));
  // res.status(200).json(flhabrProjects);
};

// ? flhabrStart*************************************************************************
exports.flhabrProjectsRead = async (req, res, next) => {
  if (+req.query.cnt === 0) return res.json({ cnt: Object.keys(flhabrProjects.projects).length, date: flhabrProjects.date });
  let firstTime = req.query.firstTime;

  let cnt = req.query.cnt;
  let length = Object.keys(flhabrProjects.projects).length;
  let arr = Object.keys(flhabrProjects.projects)[length - cnt];

  let projectsArr;
  let deleted = null;
  if (firstTime === 'true') {
    projectsArr = utils.copyArrOfObjects(flhabrProjects.projects[arr]);
  } else {
    projectsArr = utils.diff(flhabrPrevProjects.projects[arr], flhabrProjects.projects[arr]);
    deleted = utils.diff2(flhabrProjects.projects[arr], flhabrPrevProjects.projects[arr]);
    console.log('projects', projectsArr.length);
    console.log('deleted', deleted.length);

    if (projectsArr.length || deleted.length) flhabrPrevProjects.projects[arr] = utils.copyArrOfObjects(flhabrProjects.projects[arr]);
  }

  res.json({ cnt: cnt - 1, [arr]: projectsArr, arrName: arr, deleted });
};

let timeout;
let firstTimeReadProjects = true;
exports.flhabrStart = async (req, res, next) => {
  canLoading = true;

  if (firstTimeReadProjects) {
    let fileExists = utils.fileExists('../client/src/assets/flhabrProjects.json');
    if (fileExists) {
      let projects = JSON.parse(utils.readFileSync('../client/src/assets/flhabrProjects.json'));
      if (projects.projects === undefined) {
        res.json({ start: true, message: 'file is empty' });
      } else {
        flhabrProjects = utils.deepCloneObject(projects);
        flhabrPrevProjects = utils.deepCloneObject(projects);
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

  const recursiveLoad = async () => {
    console.log('flhabr start load'.bgYellow);
    try {
      await this.flhabrLinksCheerio().then(() => {
        if (!canLoading) return;

        console.log('flhabr end load'.bgMagenta);
        timeout = setTimeout(recursiveLoad, 60000 * 5);
      });
    } catch (error) {
      clearTimeout(timeout);
    }
  };

  recursiveLoad();
};

// ? flhabrAbort********************************************************************************
exports.flhabrAbort = async (req, res, next) => {
  clearTimeout(timeout);
  isLoading = false;
  canLoading = false;
  await createNewNightmare({ aborted: true });

  res.json({ aborted: true });
};
