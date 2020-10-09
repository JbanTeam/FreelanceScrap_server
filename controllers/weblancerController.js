const Nightmare = require('nightmare');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

const colors = require('colors');

const utils = require('../utils');
const moment = require('moment');

let nightmare = Nightmare({
  // show: true,
  openDevTools: {
    mode: 'detach',
  },
  // webPreferences: {
  //   webSecurity: false,
  // },
});

let weblancerProjects = {
  projects: {},
  date: 'none',
};

let weblancerPrevProjects = {
  projects: {},
  date: 'none',
};

let canLoading;

// ! *********************************************************************************
// weblancer********************************************************************************
// weblancer********************************************************************************
async function createNewNightmare({ msg, error, aborted }) {
  if (msg) {
    console.log('message:', msg, 'err:', error);
  }
  if (aborted) {
    console.log('weblancer aborted load'.bgMagenta);
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
// ? weblancerLinksCheerio********************************************************************************
async function weblancerScrapLinksCheerio($cheerio, url) {
  let all = $cheerio('.cols_table:not(.order-last) .click_container-link.set_href');
  // console.log(all);

  let projects = [];

  if (all.length) {
    all.each((i, el) => {
      let budgetSpan = $cheerio(el).find('div:nth-child(2) > .amount > span[data-toggle="tooltip"]');
      let budget = budgetSpan.length
        ? `${budgetSpan.text().trim()}/${budgetSpan.attr('data-original-title').trim().split(' ').join('').replace('&bull;', '/').replace('•', '/')}`
        : null;

      let skills;
      let skillsDiv = $cheerio(el).find('div:nth-child(3)');
      // console.log(skillsDiv);

      if (skillsDiv.children().length > 1) {
        skills =
          skillsDiv
            .find('> span:nth-child(1) a')
            .map((i, el) => $cheerio(el).text())
            .get()
            .join(', ') +
          ', ' +
          skillsDiv.find('> span:nth-child(2)').text();
      } else {
        skills = skillsDiv
          .find('> span:nth-child(1) a')
          .map((i, el) => $cheerio(el).text())
          .get()
          .join(', ');
      }

      let fixed = !!$cheerio(el).find('.fixed_icon').length;
      let link = `${url}${$cheerio(el).find('div:first-child > .title a').attr('href')}`;
      let title = $cheerio(el).find('div:first-child > .title a').html();
      let description = $cheerio(el).find('div:first-child > p.text_field').text();
      let bets = $cheerio(el).find('.col-sm-2.text-sm-right > div.text_field').text().trim();
      let time = `${$cheerio(el).find('div:nth-child(4) .time_ago').attr('data-original-title')}/${$cheerio(el)
        .find('div:nth-child(4) .time_ago')
        .text()}`;
      let published = $cheerio(el).find('div:nth-child(4) .time_ago').attr('data-timestamp');

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
exports.weblancerLinksCheerio = async (req, res, next) => {
  let resultProjects = [];
  const url = 'https://www.weblancer.net';
  try {
    await nightmare.goto(url).wait('.index_categories .align-items-stretch:first-child .list-wide');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer projects goto error', error });
    // return res.json({ error: true, message: 'weblancer projects goto error' });
  }

  try {
    const data = await nightmare.evaluate(() => {
      return document.body.innerHTML;
    });

    // console.log(data);

    let $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

    let linksObjects = $('.index_categories .align-items-stretch:first-child .list-wide li a');
    linksObjects = linksObjects.slice(0, linksObjects.length - 1);
    let categoryLinks = [];
    linksObjects.each((i, el) => {
      categoryLinks.push(`${url}${$(el).attr('href')}`);
    });
    categoryLinks = categoryLinks.map((link) => {
      if (link.includes('html-verstka')) return { title: 'html', link: link };
      else if (link.includes('veb-programmirovanie')) return { title: 'webprog', link: link };
      else if (link.includes('sajty-pod-klyuch')) return { title: 'wholesite', link: link };
      else if (link.includes('sistemy-upravleniya-cms')) return { title: 'cms', link: link };
      else if (link.includes('internet-magaziny')) return { title: 'inetshop', link: link };
    });
    console.log(categoryLinks);

    // пробегаемся по всем страницам раздела
    for (let i = 0; i < categoryLinks.length; i++) {
      if (!canLoading) {
        return;
      }
      await nightmare.goto(categoryLinks[i].link).wait('.page_content .cols_table');

      const data = await nightmare.evaluate(() => {
        return document.body.innerHTML;
      });

      $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

      // собираем проекты с первой страницы, мы на ней находимся
      try {
        resultProjects = [...resultProjects, ...(await weblancerScrapLinksCheerio($, url))];
      } catch (error) {
        await createNewNightmare({ msg: `weblancer 1 page of ${categoryLinks[i]} parse error`, error });
        // return res.json({ error: true, message: `weblancer 1 page of ${categoryLinks[i]} parse error` });
      }

      // пробегаемся по оставшимся страницам и собираем проекты
      let isNextDisabled = false;
      let isNextExists = !!$('.pagination_box').length;
      if (!isNextExists) {
        console.log('next disabled', true, 'next exists', isNextExists);
        console.log(`weblancer ${categoryLinks[i].title} - ${resultProjects.length}`.bgGreen);
        weblancerProjects.projects[categoryLinks[i].title] = resultProjects;
        resultProjects = [];
        continue;
      }

      while (!isNextDisabled) {
        if (!canLoading) {
          return;
        }
        isNextDisabled = $('.pagination_box .text-center a.active + a').length ? false : true;
        console.log('next disabled', isNextDisabled, 'next exists', isNextExists);

        if (isNextDisabled) break;

        let nextLink = `${url}${$('.pagination_box .text-center a.active + a').attr('href')}`;
        console.log(nextLink);

        if (isNextExists && !isNextDisabled) await nightmare.goto(nextLink).wait('.page_content .cols_table').wait(1000);

        const data = await nightmare.evaluate(() => {
          return document.body.innerHTML;
        });

        $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

        try {
          resultProjects = [...resultProjects, ...(await weblancerScrapLinksCheerio($, url))];
        } catch (error) {
          await createNewNightmare({ msg: `weblancer ${nextLink} of ${categoryLinks[i]} parse error`, error });
          // return res.json({ error: true, message: `weblancer ${nextLink} of ${categoryLinks[i]} parse error` });
        }
      }

      console.log(`weblancer ${categoryLinks[i].title} - ${resultProjects.length}`.bgGreen);
      weblancerProjects.projects[categoryLinks[i].title] = resultProjects;
      resultProjects = [];
    }
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer category links parse error', error });
    // return res.json({ error: true, message: 'weblancer category links parse error' });
  }

  weblancerProjects['date'] = moment().format('DD-MM-YYYY / HH:mm:ss');
  await createNewNightmare();
  utils.writeFileSync('../client/src/assets/weblancerProjects.json', JSON.stringify(weblancerProjects));
  // res.status(200).json(weblancerProjects);
};
// ? weblancerClick********************************************************************************
async function weblancerScrapClick(section) {
  let isNextDisabled = false;
  let isNextExists = await nightmare.exists('.pagination_box');
  let resultProjects = [];

  while (!isNextDisabled) {
    if (!canLoading) {
      return;
    }
    !isNextExists ? (isNextDisabled = true) : (isNextDisabled = !(await nightmare.exists('.pagination_box .text-center a.active + a')));
    console.log('next disabled', isNextDisabled, 'next exists', isNextExists);

    let projects = await nightmare.wait('.page_content .cols_table').evaluate(() => {
      let all = [...document.querySelectorAll('.cols_table:not(.order-last) .click_container-link.set_href')];
      // console.log(all);

      if (all.length) {
        all = all.map((proj) => {
          let budget = proj
            .querySelector('div:nth-child(2) > div:first-child')
            .contains(proj.querySelector('div:nth-child(2) > .amount > span[data-toggle="tooltip"]'))
            ? `${proj.querySelector('div:nth-child(2) > .amount > span').innerText.trim()}/${proj
                .querySelector('div:nth-child(2) > .amount > span')
                .dataset.originalTitle.trim()
                .split(' ')
                .join('')
                .replace('•', '/')}`
            : null;

          let skills;
          if (proj.querySelector('div:nth-child(3)').children.length > 1) {
            skills =
              Array.from(proj.querySelectorAll('div:nth-child(3) > span:nth-child(1) a'))
                .map((link) => link.innerText)
                .join(', ') +
              ', ' +
              proj.querySelector('div:nth-child(3) > span:nth-child(2)').innerText;
          } else {
            skills = Array.from(proj.querySelectorAll('div:nth-child(3) > span:nth-child(1) a'))
              .map((link) => link.innerText)
              .join(', ');
          }

          return {
            fixed: proj.querySelector('div:first-child').contains(proj.querySelector('.fixed_icon')),
            link: proj.querySelector('div:first-child > .title a').href,
            title: proj.querySelector('div:first-child > .title a').innerText,
            skills,
            description: proj.querySelector('div:first-child > p.text_field').innerText,
            budget,
            bets: proj.querySelector('div:nth-child(2) > div:last-child').innerText.trim(),
            time:
              proj.querySelector('div:nth-child(4) .time_ago').dataset.originalTitle +
              '/' +
              proj.querySelector('div:nth-child(4) .time_ago').innerText,
            published: proj.querySelector('div:nth-child(4) .time_ago').dataset.timestamp,
          };
        });
      }
      return all;
    });
    // console.log(projects);

    resultProjects = [...resultProjects, ...projects];
    // console.log(resultProjects);

    projects = [];

    if (isNextExists && !isNextDisabled)
      await nightmare.click('.pagination_box .text-center a.active + a').wait('.page_content .cols_table').wait(1000);
  }

  // console.dir(resultProjects, { depth: null });
  console.log(`weblancer ${section} - ${resultProjects.length}`.bgGreen);
  weblancerProjects.projects[section] = resultProjects;
  // console.log(weblancerProjects);
}
exports.weblancerClick = async (req, res, next) => {
  // **********************
  // идем в раздел web-programming
  try {
    await nightmare
      .goto('https://www.weblancer.net/')
      .wait('.index_categories')
      .wait('.list-unstyled.list-wide')
      .click('.index_categories .align-items-stretch:first-child .list-wide li:first-child a')
      .wait('.page_content .cols_table');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer webprog section goto error', error });
    // return res.json({ error: true, message: 'weblancer webprog section goto error' });
  }

  try {
    await weblancerScrapClick('webprog');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer webprog section parse error', error });
    // return res.json({ error: true, message: 'weblancer webprog section parse error' });
  }

  // *****************************
  // идем в раздел html
  try {
    await nightmare.click('.navbar-nav .category_tree > li:nth-child(6) ul.collapse > li:nth-child(1) a').wait('.page_content .cols_table');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer html section goto error', error });
    // return res.json({ error: true, message: 'weblancer html section goto error' });
  }

  try {
    await weblancerScrapClick('html');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer html section parse error', error });
    // return res.json({ error: true, message: 'weblancer html section parse error' });
  }

  // *****************************
  // идем в раздел интернет-магазины
  try {
    await nightmare.click('.navbar-nav .category_tree > li:nth-child(6) ul.collapse > li:nth-child(3) a').wait('.page_content .cols_table');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer inetshop section goto error', error });
    // return res.json({ error: true, message: 'weblancer inetshop section goto error' });
  }

  try {
    await weblancerScrapClick('inetshop');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer inetshop section parse error', error });
    // return res.json({ error: true, message: 'weblancer inetshop section parse error' });
  }

  // *****************************
  // идем в раздел сайты под ключ
  try {
    await nightmare.click('.navbar-nav .category_tree > li:nth-child(6) ul.collapse > li:nth-child(4) a').wait('.page_content .cols_table');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer wholesite section goto error', error });
    // return res.json({ error: true, message: 'weblancer wholesite section goto error' });
  }

  try {
    await weblancerScrapClick('wholesite');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer wholesite section parse error', error });
    // return res.json({ error: true, message: 'weblancer wholesite section parse error' });
  }

  // *****************************
  // идем в раздел cms
  try {
    await nightmare.click('.navbar-nav .category_tree > li:nth-child(6) ul.collapse > li:nth-child(5) a').wait('.page_content .cols_table');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer cms section goto error', error });
    // return res.json({ error: true, message: 'weblancer cms section goto error' });
  }

  try {
    await weblancerScrapClick('cms');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer cms section parse error', error });
    // return res.json({ error: true, message: 'weblancer cms section parse error' });
  }

  weblancerProjects['date'] = moment().format('DD-MM-YYYY / HH:mm:ss');
  await createNewNightmare();
  utils.writeFileSync('../client/src/assets/weblancerProjects.json', JSON.stringify(weblancerProjects));
  // res.status(200).json(weblancerProjects);
};

// ? weblancerCheerio********************************************************************************
async function weblancerScrapCheerio($cheerio, url) {
  let all = $cheerio('.cols_table:not(.order-last) .click_container-link.set_href');
  // console.log(all);

  let projects = [];

  if (all.length) {
    all.each((i, el) => {
      let budgetSpan = $cheerio(el).find('div:nth-child(2) > .amount > span[data-toggle="tooltip"]');
      let budget = budgetSpan.length
        ? `${budgetSpan.text().trim()}/${budgetSpan.attr('title').trim().split(' ').join('').replace('&bull;', '/').replace('•', '/')}`
        : null;

      let skills;
      let skillsDiv = $cheerio(el).find('div:nth-child(3)');
      // console.log(skillsDiv);

      if (skillsDiv.children().length > 1) {
        skills =
          skillsDiv
            .find('> span:nth-child(1) a')
            .map((i, el) => $cheerio(el).text())
            .get()
            .join(', ') +
          ', ' +
          skillsDiv.find('> span:nth-child(2)').text();
      } else {
        skills = skillsDiv
          .find('> span:nth-child(1) a')
          .map((i, el) => $cheerio(el).text())
          .get()
          .join(', ');
      }

      let fixed = !!$cheerio(el).find('.fixed_icon').length;
      let link = `${url}${$cheerio(el).find('div:first-child > .title a').attr('href')}`;
      let title = $cheerio(el).find('div:first-child > .title a').html();
      let description = $cheerio(el).find('div:first-child > p.text_field').text();
      let bets = $cheerio(el).find('.col-sm-2.text-sm-right > div.text_field').text().trim();
      let time = `${$cheerio(el).find('div:nth-child(4) .time_ago').attr('title')}/${$cheerio(el).find('div:nth-child(4) .time_ago').text()}`;
      let published = $cheerio(el).find('div:nth-child(4) .time_ago').attr('data-timestamp');

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
// let firstTime = true;
// exports.weblancerCheerio = async (req, res, next) => {
//   if (!firstTime) {
//     weblancerProjects.projects.webprog.push({
//       fixed: true,
//       link: `https://www.weblancer.net/vacancies/veb-programmirovanie-31/php-razrabotchik-${Math.random() * 6000}/`,
//       title: `PHP-разработчик`,
//       skills: `Веб-программирование, Вакансия`,
//       description: `${Math.random() * 1000000}`,
//       bets: `${Math.random() * 20} заявок`,
//       time: '27.09.2020 в 23:19/17 часов назад',
//       published: '1601237965',
//     });
//     weblancerProjects.projects.html.push({
//       fixed: true,
//       link: `https://www.weblancer.net/vacancies/veb-programmirovanie-31/php-razrabotchik-${Math.random() * 6000}/`,
//       title: `PHP-разработчик`,
//       skills: `Веб-программирование, Вакансия`,
//       description: `${Math.random() * 1000000}`,
//       bets: `${Math.random() * 20} заявок`,
//       time: '27.09.2020 в 23:19/17 часов назад',
//       published: '1601237965',
//     });
//   }
//   firstTime = false;
// };
exports.weblancerCheerio = async (req, res, next) => {
  let resultProjects = [];

  const url = 'https://www.weblancer.net';
  // на данной бирже стоит кодировка win1251, поэтому переводим в utf-8
  let response = await fetch(url);
  response = await response.buffer();
  let data = iconv.decode(response, 'cp1251').toString();
  // console.log(data);

  let $ = cheerio.load(data, { decodeEntities: false });

  let linksObjects = $('.index_categories .align-items-stretch:first-child .list-wide li a');
  linksObjects = linksObjects.slice(0, linksObjects.length - 1);
  let categoryLinks = [];
  linksObjects.each((i, el) => {
    categoryLinks.push(`${url}${$(el).attr('href')}`);
  });
  categoryLinks = categoryLinks.map((link) => {
    if (link.includes('html-verstka')) return { title: 'html', link: link };
    else if (link.includes('veb-programmirovanie')) return { title: 'webprog', link: link };
    else if (link.includes('sajty-pod-klyuch')) return { title: 'wholesite', link: link };
    else if (link.includes('sistemy-upravleniya-cms')) return { title: 'cms', link: link };
    else if (link.includes('internet-magaziny')) return { title: 'inetshop', link: link };
  });
  console.log(categoryLinks);

  // пробегаемся по всем страницам раздела
  for (let i = 0; i < categoryLinks.length; i++) {
    if (!canLoading) {
      return;
    }
    let response = await fetch(categoryLinks[i].link);
    response = await response.buffer();
    let data = iconv.decode(response, 'cp1251').toString();
    // console.log(data);

    $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

    // собираем проекты с первой страницы, мы на ней находимся
    try {
      resultProjects = [...resultProjects, ...(await weblancerScrapCheerio($, url))];
    } catch (error) {
      console.log('message', `weblancer 1 page of ${categoryLinks[i]} parse error`, 'err', error);
      // return res.json({ error: true, message: `weblancer 1 page of ${categoryLinks[i]} parse error` });
    }

    // пробегаемся по оставшимся страницам и собираем проекты
    let isNextDisabled = false;
    let isNextExists = !!$('.pagination_box').length;
    if (!isNextExists) {
      console.log('next disabled', true, 'next exists', isNextExists);
      console.log(`weblancer ${categoryLinks[i].title} - ${resultProjects.length}`.bgGreen);
      weblancerProjects.projects[categoryLinks[i].title] = resultProjects;
      resultProjects = [];
      continue;
    }

    while (!isNextDisabled) {
      if (!canLoading) {
        return;
      }
      isNextDisabled = $('.pagination_box .text-center a.active + a').length ? false : true;
      console.log('next disabled', isNextDisabled, 'next exists', isNextExists);

      if (isNextDisabled) break;

      let nextLink = `${url}${$('.pagination_box .text-center a.active + a').attr('href')}`;
      console.log(nextLink);

      if (isNextExists && !isNextDisabled) {
        // ждем 1 сек чтобы не спамить запросами слишком быстро
        await new Promise((resolve) => setTimeout(resolve, 1000));

        let response = await fetch(nextLink);
        response = await response.buffer();
        let data = iconv.decode(response, 'cp1251').toString();
        $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });
      }

      try {
        resultProjects = [...resultProjects, ...(await weblancerScrapCheerio($, url))];
      } catch (error) {
        console.log('message', `weblancer ${nextLink} of ${categoryLinks[i]} parse error`, 'err', error);
        // return res.json({ error: true, message: `weblancer ${nextLink} of ${categoryLinks[i]} parse error` });
      }
    }

    console.log(`weblancer ${categoryLinks[i].title} - ${resultProjects.length}`.bgGreen);
    weblancerProjects.projects[categoryLinks[i].title] = resultProjects;
    resultProjects = [];
  }
  weblancerProjects['date'] = moment().format('DD-MM-YYYY / HH:mm:ss');
  utils.writeFileSync('../client/src/assets/weblancerProjects.json', JSON.stringify(weblancerProjects));
  // res.status(200).json(weblancerProjects);
};

// ? weblancerStart********************************************************************************
exports.weblancerProjectsRead = async (req, res, next) => {
  if (+req.query.cnt === 0) return res.json({ cnt: Object.keys(weblancerProjects.projects).length, date: weblancerProjects.date });

  let cnt = req.query.cnt;
  let length = Object.keys(weblancerProjects.projects).length;
  let arr = Object.keys(weblancerProjects.projects)[length - cnt];

  let projectsArr;
  let deleted = null;
  if (req.query.first === 'true') {
    projectsArr = utils.copyArrOfObjects(weblancerProjects.projects[arr]);
  } else {
    projectsArr = utils.diff(weblancerPrevProjects.projects[arr], weblancerProjects.projects[arr]);
    deleted = utils.diff2(weblancerProjects.projects[arr], weblancerPrevProjects.projects[arr]);
    console.log('projects', projectsArr.length);
    console.log('deleted', deleted.length);

    if (projectsArr.length || deleted.length) weblancerPrevProjects.projects[arr] = utils.copyArrOfObjects(weblancerProjects.projects[arr]);
  }

  res.json({ cnt: cnt - 1, [arr]: projectsArr, arrName: arr, deleted });
};

let timeout;
exports.weblancerStart = async (req, res, next) => {
  canLoading = true;
  let fileExists = utils.fileExists('../client/src/assets/weblancerProjects.json');
  if (fileExists) {
    let projects = JSON.parse(utils.readFileSync('../client/src/assets/weblancerProjects.json'));
    if (projects.projects === undefined) {
      res.json({ start: true, message: 'file is empty' });
    } else {
      weblancerProjects = utils.deepCloneObject(projects);
      weblancerPrevProjects = utils.deepCloneObject(projects);
      res.json({ start: true });
    }
  } else {
    res.json({ start: true, message: 'file not exists' });
  }

  const recursiveLoad = async () => {
    console.log('weblancer start load'.bgYellow);
    let loadFunction;
    switch (req.query.type) {
      case 'cheerio':
        loadFunction = this.weblancerCheerio;
        break;
      case 'links':
        loadFunction = this.weblancerLinksCheerio;
        break;
      case 'click':
        loadFunction = this.weblancerClick;
        break;
      default:
        loadFunction = this.weblancerCheerio;
        break;
    }
    try {
      await loadFunction().then(() => {
        if (!canLoading) return;

        console.log('weblancer end load'.bgMagenta);
        timeout = setTimeout(recursiveLoad, 60000 * 5);
      });
    } catch (error) {
      clearTimeout(timeout);
    }
  };

  recursiveLoad();
};

// ? weblancerAbort********************************************************************************
exports.weblancerAbort = async (req, res, next) => {
  clearTimeout(timeout);
  canLoading = false;
  await createNewNightmare({ aborted: true });

  res.json({ aborted: true });
};
