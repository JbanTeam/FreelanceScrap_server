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
  // выводим ссобщения в консоль и заканчиваем работу nightmare и создаем его новый экземпляр
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
// обходим страницы с помощью nightmare и cheerio
async function freelanceruScrapLinksCheerio($cheerio, url) {
  let all = $cheerio('.projects.projects-filtered .proj');
  // console.log(all);

  // формируем массив объектов с нужными полями
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
  // заранее формируем массив ссылок и названий разделов
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
      // идем в раздел
      await nightmare.goto(categoryLinks[i].link).wait('.projects.projects-filtered').wait(1000);

      // загружаем страницу в cheerio
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

      let isNextDisabled = false;
      let isNextExists = !!$('.pagination').length;
      // если страниц больше нет записываем результаты
      if (!isNextExists) {
        console.log('next disabled', true, 'next exists', isNextExists);
        console.log(`freelanceru ${section} - ${resultProjects.length}`.bgGreen);
        // если массив соответсвующего раздела undefined (происходит если db/*.json не существует или пуст)
        if (freelanceruPrevProjects.projects[section] === undefined) {
          freelanceruPrevProjects.projects[section] = resultProjects;
          freelanceruPrevProjects.newProjects[section] = resultProjects;
          freelanceruPrevProjects.deleted[section] = [];
        } else {
          freelanceruPrevProjects.newProjects[section] = utils.diff(freelanceruPrevProjects.projects[section], resultProjects);
          freelanceruPrevProjects.deleted[section] = utils.diff2(resultProjects, freelanceruPrevProjects.projects[section]);
        }
        freelanceruProjects.projects[section] = resultProjects;
        resultProjects = [];
        continue;
      }

      // пробегаемся по оставшимся страницам и собираем проекты
      // пока есть следующая страница собираем проекты
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
      // если массив соответсвующего раздела undefined (происходит если db/*.json не существует или пуст)
      if (freelanceruPrevProjects.projects[section] === undefined) {
        freelanceruPrevProjects.projects[section] = resultProjects;
        freelanceruPrevProjects.newProjects[section] = resultProjects;
        freelanceruPrevProjects.deleted[section] = [];
      } else {
        freelanceruPrevProjects.newProjects[section] = utils.diff(freelanceruPrevProjects.projects[section], resultProjects);
        freelanceruPrevProjects.deleted[section] = utils.diff2(resultProjects, freelanceruPrevProjects.projects[section]);
      }
      freelanceruProjects.projects[section] = resultProjects;
      resultProjects = [];
    }
  } catch (error) {
    await createNewNightmare({ msg: `freelanceru category links goto error`, error });
    // return res.json({ error: true, message: `freelanceru category links goto error` });
  }

  // устанавливаем дату
  freelanceruProjects['date'] = moment().format('DD-MM-YYYY / HH:mm:ss');
  // завершаем работу nightmare и создаем его новый экземпляр
  await createNewNightmare({});
  // записываем проекты в файл
  utils.writeFileSync('./db/freelanceruProjects.json', JSON.stringify(freelanceruProjects));
};

// ? freelanceruStart*******************************************************************************************
// читаем проекты
exports.freelanceruProjectsRead = async (req, res, next) => {
  // если cnt === 0, то отправляем клиенту количество массивов проектов
  if (+req.query.cnt === 0) return res.json({ cnt: Object.keys(freelanceruPrevProjects.projects).length, date: freelanceruPrevProjects.date });
  let firstTime = req.query.firstTime;

  let cnt = +req.query.cnt;
  let length = Object.keys(freelanceruPrevProjects.projects).length;
  let arr = Object.keys(freelanceruPrevProjects.projects)[length - cnt];

  let projectsArr;
  let deleted = null;
  let newProjects = null;
  // если клиент впервые читает проекты
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

// начинаем загрузку
let timeout;
let firstTimeReadProjects = true;
exports.freelanceruStart = async (req, res, next) => {
  canLoading = true;
  // если первый раз читаем проекты
  if (firstTimeReadProjects) {
    let fileExists = utils.fileExists('./db/freelanceruProjects.json');
    // если файл существует
    if (fileExists) {
      let projects = JSON.parse(utils.readFileSync('./db/freelanceruProjects.json'));
      // если файл пустой
      if (projects.projects === undefined) {
        freelanceruPrevProjects.newProjects = {};
        freelanceruPrevProjects.deleted = {};
        res.json({ start: true, message: 'file is empty' });
      } else {
        // если файл существует и он не пуст
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
      // если файл не существует
      freelanceruPrevProjects.newProjects = {};
      freelanceruPrevProjects.deleted = {};
      res.json({ start: true, message: 'file not exists' });
    }
    isLoading = true;
    firstTimeReadProjects = false;
  } else {
    // если не первый раз читаем проекты
    if (isLoading) {
      // если в данный момент идет загрузка (запущена с другого клиенты, телеграм бота)
      return res.json({ start: true });
    }
    isLoading = true;
    res.json({ start: true });
  }

  let cnt = 0;

  // рекурсивная загрузка с интервалом
  const recursiveLoad = async () => {
    console.log('freelanceru start load'.bgYellow);
    try {
      await this.freelanceruLinksCheerio().then(() => {
        if (!canLoading) return;
        cnt++;
        // обнуляем новые проекты
        if (cnt > 50) {
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

// обнуляем новые проекты и удаленные, freelanceruPrevProjects = freelanceruProjects
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
// прервать загрузку
exports.freelanceruAbort = async (req, res, next) => {
  clearTimeout(timeout);
  isLoading = false;
  canLoading = false;

  res.json({ aborted: true });
  await createNewNightmare({ aborted: true });
};
