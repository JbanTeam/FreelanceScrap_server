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

let freelanceruProjects = {
  projects: {},
  date: 'none',
};

let freelanceruPrevProjects = {
  projects: {},
  date: 'none',
};

let newProjectsCleaned = false;
let isLoading = false;
let canLoading;

// ! *********************************************************************************
// freelance-ru********************************************************************************
// freelance-ru********************************************************************************
async function createNewNightmare({ msg, error, aborted }) {
  if (msg) {
    console.log('message:', msg, 'err:', error);
  }
  if (aborted) {
    console.log('freelanceru aborted load'.bgMagenta);
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
// ? freelanceruLinksCheerio*******************************************************************************************
async function freelanceruScrapLinksCheerio($cheerio, url) {
  let all = $cheerio('.projects.projects-filtered .proj');
  // console.log(all);

  let projects = [];

  if (all.length) {
    all.each((i, el) => {
      let budget = $cheerio(el).find('.descr p span:nth-child(1) b').text().trim();
      let skills = null;
      let fixed = false;
      let link = `${url}${$cheerio(el).find('.descr').attr('href').trim()}`;
      let title = $cheerio(el).find('.ptitle span').text().trim();
      let description = $cheerio(el).find('.descr p span:nth-child(2)').text().trim().split(/\n/).join(' ');
      let bets = $cheerio(el).find('.list-inline .messages a i').text().trim();
      let time = $cheerio(el).find('.list-inline .pdata').attr('title').trim();
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
exports.freelanceruLinksCheerio = async (req, res, next) => {
  let resultProjects = [];
  const url = 'https://freelance.ru';
  const categoryLinks = [
    {
      title: 'webprog',
      link: 'https://freelance.ru/projects/filter/?specs=116&page=1',
    },
    {
      title: 'prog&it',
      link: 'https://freelance.ru/projects/filter/?specs=4&page=1',
    },
  ];

  try {
    // пробегаемся по всем страницам разделам
    for (let i = 0; i < categoryLinks.length; i++) {
      if (!canLoading) {
        return;
      }
      await nightmare.goto(categoryLinks[i].link).wait('.projects.projects-filtered').wait(1000);

      const data = await nightmare.evaluate(() => {
        return document.body.innerHTML;
      });

      $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

      // собираем проекты с первой страницы, мы на ней находимся
      let section = categoryLinks[i].title;
      try {
        resultProjects = [...resultProjects, ...(await freelanceruScrapLinksCheerio($, url))];
      } catch (error) {
        await createNewNightmare({ msg: `freelanceru 1 page of ${section} parse error`, error });
        // return res.json({ error: true, message: `freelanceru 1 page of ${categoryLinks[i]} parse error` });
      }

      // пробегаемся по оставшимся страницам и собираем проекты
      let isNextDisabled = false;
      let isNextExists = !!$('.pagination').length;
      if (!isNextExists) {
        console.log('next disabled', true, 'next exists', isNextExists);
        console.log(`freelanceru ${section} - ${resultProjects.length}`.bgGreen);
        freelanceruPrevProjects.newProjects[section] = utils.diff(freelanceruPrevProjects.projects[section], resultProjects);
        freelanceruPrevProjects.deleted[section] = utils.diff2(resultProjects, freelanceruPrevProjects.projects[section]);
        freelanceruProjects.projects[section] = resultProjects;
        resultProjects = [];
        continue;
      }

      while (!isNextDisabled) {
        if (!canLoading) {
          return;
        }
        isNextDisabled = $('.pagination li.active + li').length ? false : true;
        console.log('next disabled', isNextDisabled, 'next exists', isNextExists);

        if (isNextDisabled) break;

        let nextLink = `${url}${$('.pagination li.active + li a').attr('href')}`;
        console.log(nextLink);

        if (isNextExists && !isNextDisabled) await nightmare.goto(nextLink).wait('.projects.projects-filtered').wait(1000);

        const data = await nightmare.evaluate(() => {
          return document.body.innerHTML;
        });

        $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

        try {
          resultProjects = [...resultProjects, ...(await freelanceruScrapLinksCheerio($, url))];
        } catch (error) {
          await createNewNightmare({ msg: `freelanceru ${nextLink} of ${section} parse error`, error });
          // return res.json({ error: true, message: `freelanceru ${nextLink} of ${section} parse error` });
        }
      }

      console.log(`freelanceru ${section} - ${resultProjects.length}`.bgGreen);
      freelanceruPrevProjects.newProjects[section] = utils.diff(freelanceruPrevProjects.projects[section], resultProjects);
      freelanceruPrevProjects.deleted[section] = utils.diff2(resultProjects, freelanceruPrevProjects.projects[section]);
      freelanceruProjects.projects[section] = resultProjects;
      resultProjects = [];
    }
  } catch (error) {
    await createNewNightmare({ msg: `freelanceru category links goto error`, error });
    // return res.json({ error: true, message: `freelanceru category links goto error` });
  }

  freelanceruProjects['date'] = moment().format('DD-MM-YYYY / HH:mm:ss');
  await createNewNightmare({});
  // utils.writeFileSync('../client/src/assets/freelanceruProjects.json', JSON.stringify(freelanceruProjects));
};

// ? freelanceruStart*******************************************************************************************
exports.freelanceruProjectsRead = async (req, res, next) => {
  if (+req.query.cnt === 0) return res.json({ cnt: Object.keys(freelanceruPrevProjects.projects).length, date: freelanceruPrevProjects.date });
  let firstTime = req.query.firstTime;

  let cnt = +req.query.cnt;
  let length = Object.keys(freelanceruPrevProjects.projects).length;
  let arr = Object.keys(freelanceruPrevProjects.projects)[length - cnt];

  let projectsArr;
  let deleted = null;
  let newProjects = null;
  if (firstTime === 'true') {
    if (freelanceruPrevProjects.newProjects[arr].length || freelanceruPrevProjects.deleted[arr].length) {
      newProjects = freelanceruPrevProjects.newProjects[arr];
      deleted = freelanceruPrevProjects.deleted[arr];
    }
    projectsArr = freelanceruPrevProjects.projects[arr];
  } else {
    projectsArr = freelanceruPrevProjects.newProjects[arr];
    deleted = freelanceruPrevProjects.deleted[arr];
    if (projectsArr.length) newProjectsCleaned = false;
    console.log('projects', projectsArr.length);
    console.log('deleted', deleted.length);
  }

  res.json({ cnt: cnt - 1, [arr]: projectsArr, arrName: arr, deleted, newProjects, newProjectsCleaned });
};

let timeout;
let firstTimeReadProjects = true;
exports.freelanceruStart = async (req, res, next) => {
  canLoading = true;

  if (firstTimeReadProjects) {
    let fileExists = utils.fileExists('../client/src/assets/freelanceruProjects.json');
    if (fileExists) {
      let projects = JSON.parse(utils.readFileSync('../client/src/assets/freelanceruProjects.json'));
      if (projects.projects === undefined) {
        res.json({ start: true, message: 'file is empty' });
      } else {
        freelanceruPrevProjects = utils.deepCloneObject(projects);
        freelanceruPrevProjects.newProjects = {};
        freelanceruPrevProjects.deleted = {};
        Object.keys(freelanceruPrevProjects.projects).forEach((proj) => {
          freelanceruPrevProjects.newProjects[proj] = [];
          freelanceruPrevProjects.deleted[proj] = [];
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
    console.log('freelanceru start load'.bgYellow);
    try {
      await this.freelanceruLinksCheerio().then(() => {
        if (!canLoading) return;
        cnt++;
        if (cnt > 1) {
          cnt = 0;
          mergeProjects();
        }
        console.log('freelanceru end load'.bgMagenta);
        timeout = setTimeout(recursiveLoad, 60000 * 5);
      });
    } catch (error) {
      clearTimeout(timeout);
    }
  };

  recursiveLoad();
};

const mergeProjects = () => {
  Object.keys(freelanceruPrevProjects.newProjects).forEach((proj) => {
    while (freelanceruPrevProjects.newProjects[proj].length) {
      freelanceruPrevProjects.newProjects[proj].pop();
    }
  });
  Object.keys(freelanceruPrevProjects.deleted).forEach((proj) => {
    while (freelanceruPrevProjects.deleted[proj].length) {
      freelanceruPrevProjects.deleted[proj].pop();
    }
  });

  freelanceruPrevProjects.date = freelanceruProjects.date;
  freelanceruPrevProjects.projects = utils.deepCloneObject(freelanceruProjects.projects);

  newProjectsCleaned = true;
};

// ? freelanceruAbort********************************************************************************
exports.freelanceruAbort = async (req, res, next) => {
  clearTimeout(timeout);
  isLoading = false;
  canLoading = false;
  await createNewNightmare({ aborted: true });

  res.json({ aborted: true });
};
