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

let flhuntProjects = {
  projects: {},
  date: 'none',
};

let flhuntPrevProjects = {
  projects: {},
  date: 'none',
};

let canLoading;

const url = 'https://freelancehunt.com';

// ! *********************************************************************************
// flhunt********************************************************************************
// flhunt********************************************************************************
async function createNewNightmare({ msg, error, aborted }) {
  if (msg) {
    console.log('message:', msg, 'err:', error);
  }
  if (aborted) {
    console.log('flhunt aborted load'.bgMagenta);
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
// ? flhuntLinksCheerio*************************************************************************
async function flhuntScrapLinksCheerio($cheerio, url) {
  let all = $cheerio('table.project-list tbody tr:not(.featured)');
  let premium = $cheerio('table.project-list tbody tr.featured');
  // console.log(all);

  let projects = [];

  if (premium.length) {
    premium.each((i, el) => {
      let proj = {
        premium: true,
        link: $cheerio(el).find('.biggest a').attr('href'),
        title: $cheerio(el).find('.biggest a').text(),
        skills: null,
        description: $cheerio(el).find('td p').text(),
        budget: $cheerio(el).find('td .price').length
          ? `${$cheerio(el).find('td .price').text().trim().replace(' ', '')}${$cheerio(el).find('td .price span').text().trim().replace(' ', '')}`
          : null,
        bets: $cheerio(el).find('td div:last-child > div:last-child > span').text().trim().split(' ')[0],
        time: null,
        published: $cheerio(el).attr('data-published'),
      };
      projects.push(proj);
    });
  }

  if (all.length) {
    all.each((i, el) => {
      let proj = {
        premium: false,
        link: $cheerio(el).find('td:first-child a').attr('href'),
        title: $cheerio(el).find('td:first-child a').text(),
        skills: $cheerio(el).find('td:first-child .skill-highlight').text(),
        description: null,
        budget: $cheerio(el).find('td.project-budget span').children().length
          ? `${$cheerio(el).find('td.project-budget span .price').text().trim().replace(' ', '')}${$cheerio(el)
              .find('td.project-budget span .price span')
              .text()
              .trim()
              .replace(' ', '')}`
          : null,
        bets: $cheerio(el).find('td:nth-child(3) a').text(),
        time: $cheerio(el).find('td:nth-child(4) > div').attr('data-original-title'),
        published: $cheerio(el).attr('data-published'),
      };

      projects.push(proj);
    });
  }

  return projects;
}
exports.flhuntLinksCheerio = async (req, res, next) => {
  let resultProjects = [];
  try {
    await nightmare
      .goto(url + '/projects')
      .wait('table.project-list')
      .wait('#skill-group-selector');
  } catch (error) {
    await createNewNightmare({ msg: 'flhunt projects goto error', error });
    // return res.json({ error: true, message: 'flhunt projects goto error' });
  }

  try {
    const data = await nightmare.evaluate(() => {
      return document.body.innerHTML;
    });

    let $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

    let links = $('#skill-group-1 a')
      .map((i, el) => url + $(el).attr('href'))
      .get();
    let links2 = $('#skill-group-6 a')
      .map((i, el) => url + $(el).attr('href'))
      .get();

    links = links.filter((link) => {
      return link.includes('javascript') || link.includes('nodejs') || link.includes('veb-programmirovanie') || link.includes('parsing-dannyih');
    });
    links2 = links2.filter((link) => {
      return link.includes('html-css-verstka');
    });

    let categoryLinks = [...links2, ...links].map((link) => {
      if (link.includes('javascript')) return { title: 'javascript', link: link };
      else if (link.includes('nodejs')) return { title: 'nodejs', link: link };
      else if (link.includes('veb-programmirovanie')) return { title: 'webprog', link: link };
      else if (link.includes('parsing-dannyih')) return { title: 'parsing', link: link };
      else if (link.includes('html-css-verstka')) return { title: 'html', link: link };
    });
    console.log(categoryLinks);

    // пробегаемся по всем страницам раздела
    for (let i = 0; i < categoryLinks.length; i++) {
      if (!canLoading) return;

      await nightmare.goto(categoryLinks[i].link).wait('table.project-list');

      const data = await nightmare.evaluate(() => {
        return document.body.innerHTML;
      });

      $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

      // собираем проекты с первой страницы, мы на ней находимся
      try {
        resultProjects = [...resultProjects, ...(await flhuntScrapLinksCheerio($, url))];
      } catch (error) {
        await createNewNightmare({ msg: `flhunt 1 page of ${categoryLinks[i]} parse error`, error });
        // return res.json({ error: true, message: `flhunt 1 page of ${categoryLinks[i]} parse error` });
      }

      // пробегаемся по оставшимся страницам и собираем проекты
      let isNextDisabled = false;
      let isNextExists = $('.pagination li').length > 0;
      if (!isNextExists) {
        console.log('next disabled', true, 'next exists', isNextExists);
        console.log(`flhunt ${categoryLinks[i].title} - ${resultProjects.length}`.bgGreen);
        flhuntProjects.projects[categoryLinks[i].title] = resultProjects;
        resultProjects = [];
        continue;
      }

      while (!isNextDisabled) {
        if (!canLoading) return;

        isNextDisabled = $('.pagination ul li:last-child.disabled').length > 0;
        console.log('next disabled', isNextDisabled, 'next exists', isNextExists);

        if (isNextDisabled) break;

        let nextLink = url + $('.pagination ul > li.active + li a').attr('href');
        console.log(nextLink);

        if (isNextExists && !isNextDisabled) await nightmare.goto(nextLink).wait('table.project-list').wait(1000);

        const data = await nightmare.evaluate(() => {
          return document.body.innerHTML;
        });

        $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

        try {
          resultProjects = [...resultProjects, ...(await flhuntScrapLinksCheerio($, url))];
        } catch (error) {
          await createNewNightmare({ msg: `flhunt ${nextLink} of ${categoryLinks[i]} parse error`, error });
          // return res.json({ error: true, message: `flhunt ${nextLink} of ${categoryLinks[i]} parse error` });
        }
      }

      console.log(`flhunt ${categoryLinks[i].title} - ${resultProjects.length}`.bgGreen);
      flhuntProjects.projects[categoryLinks[i].title] = resultProjects;
      resultProjects = [];
    }
  } catch (error) {
    await createNewNightmare({ msg: 'flhunt category links parse error', error });
    // return res.json({ error: true, message: 'flhunt category links parse error' });
  }

  flhuntProjects['date'] = moment().format('DD-MM-YYYY / HH:mm:ss');
  await createNewNightmare();
  utils.writeFileSync('../client/src/assets/flhuntProjects.json', JSON.stringify(flhuntProjects));
  // res.status(200).json(flhuntProjects);
};
// ? flhuntLinks********************************************************************************
async function flhuntScrapLinks() {
  let projects = await nightmare.evaluate(() => {
    let all = [...document.querySelectorAll('table.project-list tbody tr:not(.featured)')];
    let premium = [...document.querySelectorAll('table.project-list tbody tr.featured')];
    // console.log('all', all, 'premium', premium);

    if (all.length) {
      all = all.map((proj) => {
        return {
          premium: false,
          link: proj.querySelector('td:first-child a').href,
          title: proj.querySelector('td:first-child a').innerText,
          skills: proj.querySelector('td:first-child .skill-highlight').innerText,
          description: null,
          budget: proj.querySelector('td.project-budget span').children.length
            ? `${proj.querySelector('td.project-budget span .price').innerText}${proj.querySelector('td.project-budget span .price span').innerText}`
            : null,
          bets: proj.querySelector('td:nth-child(3) a').innerText,
          time: proj.querySelector('td:nth-child(4) > div').dataset.originalTitle,
          published: proj.dataset.published,
        };
      });
    }

    if (premium.length) {
      premium = premium.map((proj) => {
        return {
          premium: true,
          link: proj.querySelector('.biggest a').href,
          title: proj.querySelector('.biggest a').innerText,
          skills: null,
          description: proj.querySelector('td p').innerText,
          budget: proj.querySelector('td').contains(proj.querySelector('.price'))
            ? `${proj.querySelector('td .price').innerText}${proj.querySelector('td .price span').innerText}`
            : null,
          bets: proj.querySelector('td div:last-child > div:last-child > span').innerText.trim().split(' ')[0],
          time: null,
          published: proj.dataset.published,
        };
      });
    }

    return [...premium, ...all];
  });
  return projects;
}
exports.flhuntLinks = async (req, res, next) => {
  let resultProjects = [];

  try {
    await nightmare
      .goto(url + '/projects')
      .wait('table.project-list')
      .wait('#skill-group-selector');
  } catch (error) {
    await createNewNightmare({ msg: 'flhunt projects goto error', error });
    // return res.json({ error: true, message: 'flhunt projects goto error' });
  }

  // получаем ссылки на разделы
  try {
    const categoryLinks = await nightmare.evaluate(() => {
      let links = [...document.querySelectorAll('#skill-group-1 a')].map((link) => link.href);
      let links2 = [...document.querySelectorAll('#skill-group-6 a')].map((link) => link.href);

      links = links.filter((link) => {
        return link.includes('javascript') || link.includes('nodejs') || link.includes('veb-programmirovanie') || link.includes('parsing-dannyih');
      });
      links2 = links2.filter((link) => {
        return link.includes('html-css-verstka');
      });

      return [...links2, ...links].map((link) => {
        if (link.includes('javascript')) return { title: 'javascript', link: link };
        else if (link.includes('nodejs')) return { title: 'nodejs', link: link };
        else if (link.includes('veb-programmirovanie')) return { title: 'webprog', link: link };
        else if (link.includes('parsing-dannyih')) return { title: 'parsing', link: link };
        else if (link.includes('html-css-verstka')) return { title: 'html', link: link };
      });
    });

    console.log(categoryLinks);

    // пробегаемся по всем страницам раздела
    for (let i = 0; i < categoryLinks.length; i++) {
      if (!canLoading) return;

      await nightmare.goto(categoryLinks[i].link).wait('table.project-list');

      // собираем проекты с первой страницы, мы на ней находимся
      try {
        resultProjects = [...resultProjects, ...(await flhuntScrapLinks())];
      } catch (error) {
        await createNewNightmare({ msg: `flhunt 1 page of ${categoryLinks[i]} parse error`, error });
        // return res.json({ error: true, message: `flhunt 1 page of ${categoryLinks[i]} parse error` });
      }

      // пробегаемся по оставшимся страницам и собираем проекты
      let isNextDisabled = false;
      let isNextExists = await nightmare.exists('.pagination li');
      if (!isNextExists) {
        console.log('next disabled', true, 'next exists', isNextExists);
        console.log(`flhunt ${categoryLinks[i].title} - ${resultProjects.length}`.bgGreen);
        flhuntProjects.projects[categoryLinks[i].title] = resultProjects;
        resultProjects = [];
        continue;
      }

      while (!isNextDisabled) {
        if (!canLoading) return;

        isNextDisabled = await nightmare.exists('.pagination ul li:last-child.disabled');
        console.log('next disabled', isNextDisabled, 'next exists', isNextExists);

        if (isNextDisabled) break;

        let nextLink = await nightmare.evaluate(() => {
          let link = document.querySelector('.pagination ul > li.active + li a').href;
          return link;
        });
        console.log(nextLink);

        if (isNextExists && !isNextDisabled) await nightmare.goto(nextLink).wait('table.project-list').wait(1000);

        try {
          resultProjects = [...resultProjects, ...(await flhuntScrapLinks())];
        } catch (error) {
          await createNewNightmare({ msg: `flhunt ${nextLink} of ${categoryLinks[i]} parse error`, error });
          // return res.json({ error: true, message: `flhunt ${nextLink} of ${categoryLinks[i]} parse error` });
        }
      }

      console.log(`flhunt ${categoryLinks[i].title} - ${resultProjects.length}`.bgGreen);
      flhuntProjects.projects[categoryLinks[i].title] = resultProjects;
      resultProjects = [];
    }
  } catch (error) {
    await createNewNightmare({ msg: 'flhunt category links parse error', error });
    // return res.json({ error: true, message: 'flhunt category links parse error' });
  }

  flhuntProjects['date'] = moment().format('DD-MM-YYYY / HH:mm:ss');
  await createNewNightmare();
  utils.writeFileSync('../client/src/assets/flhuntProjects.json', JSON.stringify(flhuntProjects));
  // res.status(200).json(flhuntProjects);
};

// ? flhuntClick**************************************************************************
async function flhuntScrapClick(section) {
  let isNextDisabled = false;
  let isNextExists = await nightmare.exists('.pagination li');
  let resultProjects = [];

  while (!isNextDisabled) {
    if (!canLoading) return;

    !isNextExists ? (isNextDisabled = true) : (isNextDisabled = await nightmare.exists('.pagination ul li:last-child.disabled'));
    console.log('next disabled', isNextDisabled, 'next exists', isNextExists);

    let projects = await nightmare.wait('table.project-list').evaluate(() => {
      let all = [...document.querySelectorAll('table.project-list tbody tr:not(.featured)')];
      let premium = [...document.querySelectorAll('table.project-list tbody tr.featured')];
      // console.log('all', all, 'premium', premium);

      if (all.length) {
        all = all.map((proj) => {
          return {
            premium: false,
            link: proj.querySelector('td:first-child a').href,
            title: proj.querySelector('td:first-child a').innerText,
            skills: proj.querySelector('td:first-child .skill-highlight').innerText,
            description: null,
            budget: proj.querySelector('td.project-budget span').children.length
              ? `${proj.querySelector('td.project-budget span .price').innerText}${
                  proj.querySelector('td.project-budget span .price span').innerText
                }`
              : null,
            bets: proj.querySelector('td:nth-child(3) a').innerText,
            time: proj.querySelector('td:nth-child(4) > div').dataset.originalTitle,
            published: proj.dataset.published,
          };
        });
      }

      if (premium.length) {
        premium = premium.map((proj) => {
          return {
            premium: true,
            link: proj.querySelector('.biggest a').href,
            title: proj.querySelector('.biggest a').innerText,
            skills: null,
            description: proj.querySelector('td p').innerText,
            budget: proj.querySelector('td').contains(proj.querySelector('.price'))
              ? `${proj.querySelector('td .price').innerText}${proj.querySelector('td .price span').innerText}`
              : null,
            bets: proj.querySelector('td div:last-child > div:last-child > span').innerText.trim().split(' ')[0],
            time: null,
            published: proj.dataset.published,
          };
        });
      }

      return [...premium, ...all];
    });
    resultProjects = [...resultProjects, ...projects];
    // console.log(resultProjects);

    projects = [];

    if (isNextExists && !isNextDisabled) await nightmare.click('.pagination li > a[rel="next"]').wait('table.project-list').wait(1000);
  }

  // console.dir(resultProjects, { depth: null });
  console.log(`flhunt ${section} - ${resultProjects.length}`.bgGreen);
  flhuntProjects.projects[section] = resultProjects;
  // console.log(flhuntProjects);
}
exports.flhuntClick = async (req, res, next) => {
  // **********************
  // идем в раздел html/css
  try {
    await nightmare
      .goto(url + '/projects')
      .wait('table.project-list')
      .wait('.panel-group')
      .click('.panel-group .panel:nth-child(3) a.title')
      .wait('.panel-group .panel:nth-child(3) ul.panel-body')
      .click('.panel-group .panel:nth-child(3) ul.panel-body li:first-child a');
  } catch (error) {
    await createNewNightmare({ msg: 'flhunt html section goto error', error });
    // return res.json({ error: true, message: 'weblancer html section goto error' });
  }

  try {
    await flhuntScrapClick('html');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer html section parse error', error });
    // return res.json({ error: true, message: 'weblancer html section parse error' });
  }

  // идем в раздел javascript
  // ******************************
  try {
    await nightmare
      .click('.panel-group .panel:nth-child(1) a.title')
      .wait('.panel-group .panel:nth-child(1) ul.panel-body')
      .click('.panel-group .panel:nth-child(1) ul.panel-body li:nth-child(8) a');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer javascript section goto error', error });
    // return res.json({ error: true, message: 'weblancer javascript section goto error' });
  }
  try {
    await flhuntScrapClick('javascript');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer javascript section parse error', error });
    // return res.json({ error: true, message: 'weblancer javascript section parse error' });
  }

  // идем в раздел nodejs
  // ******************************
  try {
    await nightmare
      .click('.panel-group .panel:nth-child(1) a.title')
      .wait('.panel-group .panel:nth-child(1) ul.panel-body')
      .click('.panel-group .panel:nth-child(1) ul.panel-body li:nth-child(11) a');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer nodejs section goto error', error });
    // return res.json({ error: true, message: 'weblancer nodejs section goto error' });
  }
  try {
    await flhuntScrapClick('nodejs');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer nodejs section parse error', error });
    // return res.json({ error: true, message: 'weblancer nodejs section parse error' });
  }

  // идем в раздел web-programming
  // ******************************
  try {
    await nightmare
      .click('.panel-group .panel:nth-child(1) a.title')
      .wait('.panel-group .panel:nth-child(1) ul.panel-body')
      .click('.panel-group .panel:nth-child(1) ul.panel-body li:nth-child(17) a');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer webprog section goto error', error });
    // return res.json({ error: true, message: 'weblancer webprog section goto error' });
  }
  try {
    await flhuntScrapClick('webprog');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer webprog section parse error', error });
    // return res.json({ error: true, message: 'weblancer webprog section parse error' });
  }

  // идем в раздел parsing
  // ******************************
  try {
    await nightmare
      .click('.panel-group .panel:nth-child(1) a.title')
      .wait('.panel-group .panel:nth-child(1) ul.panel-body')
      .click('.panel-group .panel:nth-child(1) ul.panel-body li:nth-child(21) a');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer parsing section goto error', error });
    // return res.json({ error: true, message: 'weblancer parsing section goto error' });
  }
  try {
    await flhuntScrapClick('parsing');
  } catch (error) {
    await createNewNightmare({ msg: 'weblancer parsing section parse error', error });
    // return res.json({ error: true, message: 'weblancer parsing section parse error' });
  }

  flhuntProjects['date'] = moment().format('DD-MM-YYYY / HH:mm:ss');
  await createNewNightmare();
  utils.writeFileSync('../client/src/assets/flhuntProjects.json', JSON.stringify(flhuntProjects));
  // res.status(200).json(flhuntProjects);
};

// ? flhuntStart**************************************************************************
exports.flhuntProjectsRead = async (req, res, next) => {
  if (+req.query.cnt === 0) return res.json({ cnt: Object.keys(flhuntProjects.projects).length, date: flhuntProjects.date });

  let cnt = req.query.cnt;
  let length = Object.keys(flhuntProjects.projects).length;
  let arr = Object.keys(flhuntProjects.projects)[length - cnt];

  let projectsArr;
  let deleted = null;
  if (req.query.first === 'true') {
    projectsArr = utils.copyArrOfObjects(flhuntProjects.projects[arr]);
  } else {
    projectsArr = utils.diff(flhuntPrevProjects.projects[arr], flhuntProjects.projects[arr]);
    deleted = utils.diff2(flhuntProjects.projects[arr], flhuntPrevProjects.projects[arr]);
    console.log('projects', projectsArr.length);
    console.log('deleted', deleted.length);

    if (projectsArr.length || deleted.length) flhuntPrevProjects.projects[arr] = utils.copyArrOfObjects(flhuntProjects.projects[arr]);
  }

  res.json({ cnt: cnt - 1, [arr]: projectsArr, arrName: arr, deleted });
};

let timeout;
exports.flhuntStart = async (req, res, next) => {
  canLoading = true;
  let fileExists = utils.fileExists('../client/src/assets/flhuntProjects.json');
  if (fileExists) {
    let projects = JSON.parse(utils.readFileSync('../client/src/assets/flhuntProjects.json'));
    if (projects.projects === undefined) {
      res.json({ start: true, message: 'file is empty' });
    } else {
      flhuntProjects = utils.deepCloneObject(projects);
      flhuntPrevProjects = utils.deepCloneObject(projects);
      res.json({ start: true });
    }
  } else {
    res.json({ start: true, message: 'file not exists' });
  }

  const recursiveLoad = async () => {
    console.log('flhunt start load'.bgYellow);
    let loadFunction;
    switch (req.query.type) {
      case 'cheerio':
        loadFunction = this.flhuntLinksCheerio;
        break;
      case 'links':
        loadFunction = this.flhuntLinks;
        break;
      case 'click':
        loadFunction = this.flhuntClick;
        break;
      default:
        loadFunction = this.flhuntLinksCheerio;
        break;
    }
    try {
      await loadFunction().then(() => {
        if (!canLoading) return;

        console.log('flhunt end load'.bgMagenta);
        timeout = setTimeout(recursiveLoad, 60000 * 5);
      });
    } catch (error) {
      clearTimeout(timeout);
    }
  };

  recursiveLoad();
};

// ? flhuntAbort********************************************************************************
exports.flhuntAbort = async (req, res, next) => {
  clearTimeout(timeout);
  canLoading = false;
  await createNewNightmare({ aborted: true });

  res.json({ aborted: true });
};