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
      try {
        resultProjects = [...resultProjects, ...(await freelanceruScrapLinksCheerio($, url))];
      } catch (error) {
        await createNewNightmare({ msg: `freelanceru 1 page of ${categoryLinks[i]} parse error`, error });
        // return res.json({ error: true, message: `freelanceru 1 page of ${categoryLinks[i]} parse error` });
      }

      // пробегаемся по оставшимся страницам и собираем проекты
      let isNextDisabled = false;
      let isNextExists = !!$('.pagination').length;
      if (!isNextExists) {
        console.log('next disabled', true, 'next exists', isNextExists);
        console.log(`freelanceru ${categoryLinks[i].title} - ${resultProjects.length}`.bgGreen);
        freelanceruProjects.projects[categoryLinks[i].title] = resultProjects;
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
          await createNewNightmare({ msg: `freelanceru ${nextLink} of ${categoryLinks[i]} parse error`, error });
          // return res.json({ error: true, message: `freelanceru ${nextLink} of ${categoryLinks[i]} parse error` });
        }
      }

      console.log(`freelanceru ${categoryLinks[i].title} - ${resultProjects.length}`.bgGreen);
      freelanceruProjects.projects[categoryLinks[i].title] = resultProjects;
      resultProjects = [];
    }
  } catch (error) {
    await createNewNightmare({ msg: `freelanceru category links goto error`, error });
    // return res.json({ error: true, message: `freelanceru category links goto error` });
  }

  freelanceruProjects['date'] = moment().format('DD-MM-YYYY / HH:mm:ss');
  await createNewNightmare();
  utils.writeFileSync('../client/src/assets/freelanceruProjects.json', JSON.stringify(freelanceruProjects));
};

// ? freelanceruStart*******************************************************************************************
exports.freelanceruProjectsRead = async (req, res, next) => {
  if (+req.query.cnt === 0) return res.json({ cnt: Object.keys(freelanceruProjects.projects).length, date: freelanceruProjects.date });

  let cnt = req.query.cnt;
  let length = Object.keys(freelanceruProjects.projects).length;
  let arr = Object.keys(freelanceruProjects.projects)[length - cnt];

  let projectsArr;
  let deleted = null;
  if (req.query.first === 'true') {
    projectsArr = utils.copyArrOfObjects(freelanceruProjects.projects[arr]);
  } else {
    projectsArr = utils.diff(freelanceruPrevProjects.projects[arr], freelanceruProjects.projects[arr]);
    deleted = utils.diff2(freelanceruProjects.projects[arr], freelanceruPrevProjects.projects[arr]);
    console.log('projects', projectsArr.length);
    console.log('deleted', deleted.length);

    if (projectsArr.length || deleted.length) freelanceruPrevProjects.projects[arr] = utils.copyArrOfObjects(freelanceruProjects.projects[arr]);
  }

  res.json({ cnt: cnt - 1, [arr]: projectsArr, arrName: arr, deleted });
};

let timeout;
exports.freelanceruStart = async (req, res, next) => {
  canLoading = true;
  let fileExists = utils.fileExists('../client/src/assets/freelanceruProjects.json');
  if (fileExists) {
    let projects = JSON.parse(utils.readFileSync('../client/src/assets/freelanceruProjects.json'));
    if (projects.projects === undefined) {
      res.json({ start: true, message: 'file is empty' });
    } else {
      freelanceruProjects = utils.deepCloneObject(projects);
      freelanceruPrevProjects = utils.deepCloneObject(projects);
      res.json({ start: true });
    }
  } else {
    res.json({ start: true, message: 'file not exists' });
  }

  const recursiveLoad = async () => {
    console.log('freelanceru start load'.bgYellow);
    try {
      await this.freelanceruLinksCheerio().then(() => {
        if (!canLoading) return;

        console.log('freelanceru end load'.bgMagenta);
        timeout = setTimeout(recursiveLoad, 60000 * 5);
      });
    } catch (error) {
      clearTimeout(timeout);
    }
  };

  recursiveLoad();
};

// ? freelanceruAbort********************************************************************************
exports.freelanceruAbort = async (req, res, next) => {
  clearTimeout(timeout);
  canLoading = false;
  await createNewNightmare({ aborted: true });

  res.json({ aborted: true });
};
