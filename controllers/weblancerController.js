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

let newProjectsCleaned = false;
let isLoading = false;
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
      let section = categoryLinks[i].title;
      try {
        resultProjects = [...resultProjects, ...(await weblancerScrapLinksCheerio($, url))];
      } catch (error) {
        await createNewNightmare({ msg: `weblancer 1 page of ${section} parse error`, error });
        // return res.json({ error: true, message: `weblancer 1 page of ${section} parse error` });
      }

      // пробегаемся по оставшимся страницам и собираем проекты
      let isNextDisabled = false;
      let isNextExists = !!$('.pagination_box').length;
      if (!isNextExists) {
        console.log('next disabled', true, 'next exists', isNextExists);
        console.log(`weblancer ${section} - ${resultProjects.length}`.bgGreen);
        if (weblancerPrevProjects.projects[section] === undefined) {
          weblancerPrevProjects.projects[section] = resultProjects;
          weblancerPrevProjects.newProjects[section] = resultProjects;
          weblancerPrevProjects.deleted[section] = [];
        } else {
          weblancerPrevProjects.newProjects[section] = utils.diff(weblancerPrevProjects.projects[section], resultProjects);
          weblancerPrevProjects.deleted[section] = utils.diff2(resultProjects, weblancerPrevProjects.projects[section]);
        }
        weblancerProjects.projects[section] = resultProjects;
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
          await createNewNightmare({ msg: `weblancer ${nextLink} of ${section} parse error`, error });
          // return res.json({ error: true, message: `weblancer ${nextLink} of ${section} parse error` });
        }
      }

      console.log(`weblancer ${section} - ${resultProjects.length}`.bgGreen);
      if (weblancerPrevProjects.projects[section] === undefined) {
        weblancerPrevProjects.projects[section] = resultProjects;
        weblancerPrevProjects.newProjects[section] = resultProjects;
        weblancerPrevProjects.deleted[section] = [];
      } else {
        weblancerPrevProjects.newProjects[section] = utils.diff(weblancerPrevProjects.projects[section], resultProjects);
        weblancerPrevProjects.deleted[section] = utils.diff2(resultProjects, weblancerPrevProjects.projects[section]);
      }
      weblancerProjects.projects[section] = resultProjects;
      resultProjects = [];
    }
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer category links parse error', error });
    // return res.json({ error: true, message: 'weblancer category links parse error' });
  }

  weblancerProjects['date'] = moment().format('DD-MM-YYYY / HH:mm:ss');
  await createNewNightmare({});
  utils.writeFileSync('./db/weblancerProjects.json', JSON.stringify(weblancerProjects));
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
  if (weblancerPrevProjects.projects[section] === undefined) {
    weblancerPrevProjects.projects[section] = resultProjects;
    weblancerPrevProjects.newProjects[section] = resultProjects;
    weblancerPrevProjects.deleted[section] = [];
  } else {
    weblancerPrevProjects.newProjects[section] = utils.diff(weblancerPrevProjects.projects[section], resultProjects);
    weblancerPrevProjects.deleted[section] = utils.diff2(resultProjects, weblancerPrevProjects.projects[section]);
  }
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
  await createNewNightmare({});
  utils.writeFileSync('./db/weblancerProjects.json', JSON.stringify(weblancerProjects));
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
async function fetchUrl(url) {
  let response = await fetch(url);
  response = await response.buffer();
  let data = iconv.decode(response, 'cp1251').toString();
  // console.log(data);
  return data;
}
exports.weblancerCheerio = async (req, res, next) => {
  let resultProjects = [];

  const url = 'https://www.weblancer.net';
  let $;
  // на данной бирже стоит кодировка win1251, поэтому переводим в utf-8
  try {
    $ = cheerio.load(await fetchUrl(url), { decodeEntities: false });
  } catch (error) {
    console.log(`weblancer fetch ${url} error`, error);
  }

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
    try {
      $ = cheerio.load(await fetchUrl(categoryLinks[i].link), { normalizeWhitespace: true, decodeEntities: false });
    } catch (error) {
      console.log(`weblancer fetch ${categoryLinks[i].link} error`, error);
    }

    // собираем проекты с первой страницы, мы на ней находимся
    let section = categoryLinks[i].title;
    try {
      resultProjects = [...resultProjects, ...(await weblancerScrapCheerio($, url))];
    } catch (error) {
      console.log('message', `weblancer 1 page of ${section} parse error`, 'err', error);
      // return res.json({ error: true, message: `weblancer 1 page of ${section} parse error` });
    }

    // пробегаемся по оставшимся страницам и собираем проекты
    let isNextDisabled = false;
    let isNextExists = !!$('.pagination_box').length;
    if (!isNextExists) {
      console.log('next disabled', true, 'next exists', isNextExists);
      console.log(`weblancer ${section} - ${resultProjects.length}`.bgGreen);
      if (weblancerPrevProjects.projects[section] === undefined) {
        weblancerPrevProjects.projects[section] = resultProjects;
        weblancerPrevProjects.newProjects[section] = resultProjects;
        weblancerPrevProjects.deleted[section] = [];
      } else {
        weblancerPrevProjects.newProjects[section] = utils.diff(weblancerPrevProjects.projects[section], resultProjects);
        weblancerPrevProjects.deleted[section] = utils.diff2(resultProjects, weblancerPrevProjects.projects[section]);
      }
      weblancerProjects.projects[section] = resultProjects;
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
        // ждем чтобы не спамить запросами слишком быстро
        try {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          $ = cheerio.load(await fetchUrl(nextLink), { normalizeWhitespace: true, decodeEntities: false });
        } catch (error) {
          console.log(`weblancer fetch ${nextLink} error`, error);
        }
      }

      try {
        resultProjects = [...resultProjects, ...(await weblancerScrapCheerio($, url))];
      } catch (error) {
        console.log('message', `weblancer ${nextLink} of ${section} parse error`, 'err', error);
        // return res.json({ error: true, message: `weblancer ${nextLink} of ${section} parse error` });
      }
    }

    console.log(`weblancer ${section} - ${resultProjects.length}`.bgGreen);
    if (weblancerPrevProjects.projects[section] === undefined) {
      weblancerPrevProjects.projects[section] = resultProjects;
      weblancerPrevProjects.newProjects[section] = resultProjects;
      weblancerPrevProjects.deleted[section] = [];
    } else {
      weblancerPrevProjects.newProjects[section] = utils.diff(weblancerPrevProjects.projects[section], resultProjects);
      weblancerPrevProjects.deleted[section] = utils.diff2(resultProjects, weblancerPrevProjects.projects[section]);
    }
    weblancerProjects.projects[section] = resultProjects;
    resultProjects = [];
  }
  weblancerProjects['date'] = moment().format('DD-MM-YYYY / HH:mm:ss');
  utils.writeFileSync('./db/weblancerProjects.json', JSON.stringify(weblancerProjects));
  // res.status(200).json(weblancerProjects);
};

// ? weblancerStart********************************************************************************
exports.weblancerProjectsRead = async (req, res, next) => {
  if (+req.query.cnt === 0) return res.json({ cnt: Object.keys(weblancerPrevProjects.projects).length, date: weblancerPrevProjects.date });
  let firstTime = req.query.firstTime;

  let cnt = +req.query.cnt;
  let length = Object.keys(weblancerPrevProjects.projects).length;
  let arr = Object.keys(weblancerPrevProjects.projects)[length - cnt];

  let projectsArr;
  let deleted = null;
  let newProjects = null;
  if (firstTime === 'true') {
    if (weblancerPrevProjects.newProjects[arr].length || weblancerPrevProjects.deleted[arr].length) {
      newProjects = weblancerPrevProjects.newProjects[arr];
      deleted = weblancerPrevProjects.deleted[arr];
    }
    projectsArr = weblancerPrevProjects.projects[arr];
  } else {
    projectsArr = weblancerPrevProjects.newProjects[arr];
    deleted = weblancerPrevProjects.deleted[arr];
    if (projectsArr.length) newProjectsCleaned = false;
    console.log('projects', projectsArr.length);
    console.log('deleted', deleted.length);
  }
  res.json({ cnt: cnt - 1, [arr]: projectsArr, arrName: arr, deleted, newProjects, newProjectsCleaned });
};

let timeout;
let firstTimeReadProjects = true;
exports.weblancerStart = async (req, res, next) => {
  canLoading = true;
  if (firstTimeReadProjects) {
    let fileExists = utils.fileExists('./db/weblancerProjects.json');
    if (fileExists) {
      let projects = JSON.parse(utils.readFileSync('./db/weblancerProjects.json'));
      if (projects.projects === undefined) {
        weblancerPrevProjects.newProjects = {};
        weblancerPrevProjects.deleted = {};
        res.json({ start: true, message: 'file is empty' });
      } else {
        weblancerPrevProjects = utils.deepCloneObject(projects);
        weblancerPrevProjects.newProjects = {};
        weblancerPrevProjects.deleted = {};
        Object.keys(weblancerPrevProjects.projects).forEach((proj) => {
          weblancerPrevProjects.newProjects[proj] = [];
          weblancerPrevProjects.deleted[proj] = [];
        });
        res.json({ start: true });
      }
    } else {
      weblancerPrevProjects.newProjects = {};
      weblancerPrevProjects.deleted = {};
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
        cnt++;
        if (cnt > 50) {
          cnt = 0;
          mergeProjects();
        }
        console.log('weblancer end load'.bgMagenta);
        timeout = setTimeout(recursiveLoad, 60000 * 5);
      });
    } catch (error) {
      clearTimeout(timeout);
    }
  };

  recursiveLoad();
};

const mergeProjects = () => {
  Object.keys(weblancerPrevProjects.newProjects).forEach((proj) => {
    while (weblancerPrevProjects.newProjects[proj].length) {
      weblancerPrevProjects.newProjects[proj].pop();
    }
  });
  Object.keys(weblancerPrevProjects.deleted).forEach((proj) => {
    while (weblancerPrevProjects.deleted[proj].length) {
      weblancerPrevProjects.deleted[proj].pop();
    }
  });

  weblancerPrevProjects.date = weblancerProjects.date;
  weblancerPrevProjects.projects = utils.deepCloneObject(weblancerProjects.projects);

  newProjectsCleaned = true;
};

// ? weblancerAbort********************************************************************************
exports.weblancerAbort = async (req, res, next) => {
  clearTimeout(timeout);
  isLoading = false;
  canLoading = false;

  res.json({ aborted: true });
  await createNewNightmare({ aborted: true });
};
