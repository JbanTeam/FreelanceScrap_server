const Nightmare = require('nightmare');
const axios = require('axios');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

const nightmare = Nightmare({
  show: true,
  openDevTools: {
    mode: 'detach',
  },
  // webPreferences: {
  //   webSecurity: false,
  // },
});

const flhuntProjects = {};
const weblancerProjects = {};
const flhabrProjects = {};
const freelanceruProjects = {};
const flruProjects = {};

// ! ************************************************************************
// ! ************************************************************************
// freelancehunt***********************************************************

// ? freelancehuntLinks******************************************************
async function freelancehuntScrapLinks() {
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
async function freelancehuntLinks() {
  let resultProjects = [];

  try {
    await nightmare.goto('https://freelancehunt.com/projects').wait('table.project-list').wait('#skill-group-selector');
  } catch (error) {
    console.log(error);
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
        else if (link.includes('parsing-dannyih')) return { title: 'parse', link: link };
        else if (link.includes('html-css-verstka')) return { title: 'html', link: link };
      });
    });

    // пробегаемся по всем страницам раздела
    for (let i = 0; i < categoryLinks.length; i++) {
      await nightmare.goto(categoryLinks[i].link).wait('table.project-list');

      // собираем проекты с первой страницы, мы на ней находимся
      try {
        resultProjects = [...resultProjects, ...(await freelancehuntScrapLinks())];
      } catch (error) {
        console.log(error);
      }

      // пробегаемся по оставшимся страницам и собираем проекты
      let isNextDisabled = false;
      let isNextExists = await nightmare.exists('.pagination li');
      if (!isNextExists) {
        console.log('next disabled', true, 'next exists', isNextExists);
        console.log(resultProjects.length);
        flhuntProjects[categoryLinks[i].title] = resultProjects;
        resultProjects = [];
        continue;
      }

      while (!isNextDisabled) {
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
          resultProjects = [...resultProjects, ...(await freelancehuntScrapLinks())];
        } catch (error) {
          console.log(error);
        }
      }

      console.log(resultProjects.length);
      flhuntProjects[categoryLinks[i].title] = resultProjects;
      resultProjects = [];
    }
  } catch (error) {
    console.log(error);
  }
}
// freelancehuntLinks();

// ? freelancehuntClick******************************************************
async function freelancehuntScrapClick(section) {
  let isNextDisabled = false;
  let isNextExists = await nightmare.exists('.pagination li');
  let resultProjects = [];

  while (!isNextDisabled) {
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

  console.log(resultProjects.length);
  flhuntProjects[section] = resultProjects;
  // console.log(flhuntProjects);
}
async function freelancehuntClick() {
  // **********************
  // идем в раздел html/css
  try {
    await nightmare
      .goto('https://freelancehunt.com/projects')
      .wait('table.project-list')
      .wait('.panel-group')
      .click('.panel-group .panel:nth-child(3) a.title')
      .wait('.panel-group .panel:nth-child(3) ul.panel-body')
      .click('.panel-group .panel:nth-child(3) ul.panel-body li:first-child a');
  } catch (error) {
    console.log(error);
  }

  try {
    await freelancehuntScrapClick('html');
  } catch (error) {
    console.log(error);
  }

  // идем в раздел javascript
  // ******************************
  try {
    await nightmare
      .click('.panel-group .panel:nth-child(1) a.title')
      .wait('.panel-group .panel:nth-child(1) ul.panel-body')
      .click('.panel-group .panel:nth-child(1) ul.panel-body li:nth-child(8) a');
  } catch (error) {
    console.log(error);
  }
  try {
    await freelancehuntScrapClick('javascript');
  } catch (error) {
    console.log(error);
  }

  // идем в раздел nodejs
  // ******************************
  try {
    await nightmare
      .click('.panel-group .panel:nth-child(1) a.title')
      .wait('.panel-group .panel:nth-child(1) ul.panel-body')
      .click('.panel-group .panel:nth-child(1) ul.panel-body li:nth-child(11) a');
  } catch (error) {
    console.log(error);
  }
  try {
    await freelancehuntScrapClick('nodejs');
  } catch (error) {
    console.log(error);
  }

  // идем в раздел web-programming
  // ******************************
  try {
    await nightmare
      .click('.panel-group .panel:nth-child(1) a.title')
      .wait('.panel-group .panel:nth-child(1) ul.panel-body')
      .click('.panel-group .panel:nth-child(1) ul.panel-body li:nth-child(17) a');
  } catch (error) {
    console.log(error);
  }
  try {
    await freelancehuntScrapClick('webprog');
  } catch (error) {
    console.log(error);
  }

  // идем в раздел parsing
  // ******************************
  try {
    await nightmare
      .click('.panel-group .panel:nth-child(1) a.title')
      .wait('.panel-group .panel:nth-child(1) ul.panel-body')
      .click('.panel-group .panel:nth-child(1) ul.panel-body li:nth-child(21) a');
  } catch (error) {
    console.log(error);
  }
  try {
    await freelancehuntScrapClick('parsing');
  } catch (error) {
    console.log(error);
  }
}
// freelancehuntClick();

// ? freelancehuntLinksCheerio******************************************************
async function freelancehuntScrapLinksCheerio($cheerio, url) {
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
async function freelancehuntLinksCheerio() {
  let resultProjects = [];
  const url = 'https://freelancehunt.com';
  try {
    await nightmare
      .goto(url + '/projects')
      .wait('table.project-list')
      .wait('#skill-group-selector');
  } catch (error) {
    console.log(error);
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
      else if (link.includes('parsing-dannyih')) return { title: 'parse', link: link };
      else if (link.includes('html-css-verstka')) return { title: 'html', link: link };
    });
    console.log(categoryLinks);

    // пробегаемся по всем страницам раздела
    for (let i = 0; i < categoryLinks.length; i++) {
      await nightmare.goto(categoryLinks[i].link).wait('table.project-list');

      const data = await nightmare.evaluate(() => {
        return document.body.innerHTML;
      });

      $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

      // собираем проекты с первой страницы, мы на ней находимся
      try {
        resultProjects = [...resultProjects, ...(await freelancehuntScrapLinksCheerio($, url))];
      } catch (error) {
        console.log(error);
      }

      // пробегаемся по оставшимся страницам и собираем проекты
      let isNextDisabled = false;
      let isNextExists = $('.pagination li').length > 0;
      if (!isNextExists) {
        console.log('next disabled', true, 'next exists', isNextExists);
        console.log(resultProjects.length);
        flhuntProjects[categoryLinks[i].title] = resultProjects;
        resultProjects = [];
        continue;
      }

      while (!isNextDisabled) {
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
          resultProjects = [...resultProjects, ...(await freelancehuntScrapLinksCheerio($, url))];
        } catch (error) {
          console.log(error);
        }
      }

      console.log(resultProjects.length);
      flhuntProjects[categoryLinks[i].title] = resultProjects;
      resultProjects = [];
    }
  } catch (error) {
    console.log(error);
  }
}
// freelancehuntLinksCheerio();

// ! ************************************************************************
// ! ************************************************************************
// weblancer***********************************************************

// ? weblancerLinksCheerio*********************************************************
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
async function weblancerLinksCheerio() {
  let resultProjects = [];
  const url = 'https://www.weblancer.net';
  try {
    await nightmare.goto(url).wait('.index_categories .align-items-stretch:first-child .list-wide');
  } catch (error) {
    console.log(error);
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
    for (let i = 1; i < 2; i++) {
      await nightmare.goto(categoryLinks[i].link).wait('.page_content .cols_table');

      const data = await nightmare.evaluate(() => {
        return document.body.innerHTML;
      });

      $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

      // собираем проекты с первой страницы, мы на ней находимся
      try {
        resultProjects = [...resultProjects, ...(await weblancerScrapLinksCheerio($, url))];
      } catch (error) {
        console.log(error);
      }

      // пробегаемся по оставшимся страницам и собираем проекты
      let isNextDisabled = false;
      let isNextExists = !!$('.pagination_box').length;
      if (!isNextExists) {
        console.log('next disabled', true, 'next exists', isNextExists);
        console.log(resultProjects.length);
        weblancerProjects[categoryLinks[i].title] = resultProjects;
        resultProjects = [];
        continue;
      }

      while (!isNextDisabled) {
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
          console.log(error);
        }
      }

      console.log(resultProjects.length);
      weblancerProjects[categoryLinks[i].title] = resultProjects;
      resultProjects = [];
    }
  } catch (error) {
    console.log(error);
  }
}
// weblancerLinksCheerio();

// ? weblancerClick*********************************************************
async function weblancerScrapClick(section) {
  let isNextDisabled = false;
  let isNextExists = await nightmare.exists('.pagination_box');
  let resultProjects = [];

  while (!isNextDisabled) {
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

  weblancerProjects[section] = resultProjects;
  // console.log(weblancerProjects);
}
async function weblancerClick() {
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
    console.log(error);
  }

  try {
    await weblancerScrapClick('webprog');
  } catch (error) {
    console.log(error);
  }

  // *****************************
  // идем в раздел html
  try {
    await nightmare.click('.navbar-nav .category_tree > li:nth-child(6) ul.collapse > li:nth-child(1) a').wait('.page_content .cols_table');
  } catch (error) {
    console.log(error);
  }

  try {
    await weblancerScrapClick('html');
  } catch (error) {
    console.log(error);
  }

  // *****************************
  // идем в раздел интернет-магазины
  try {
    await nightmare.click('.navbar-nav .category_tree > li:nth-child(6) ul.collapse > li:nth-child(3) a').wait('.page_content .cols_table');
  } catch (error) {
    console.log(error);
  }

  try {
    await weblancerScrapClick('inetshop');
  } catch (error) {
    console.log(error);
  }

  // *****************************
  // идем в раздел сайты под ключ
  try {
    await nightmare.click('.navbar-nav .category_tree > li:nth-child(6) ul.collapse > li:nth-child(4) a').wait('.page_content .cols_table');
  } catch (error) {
    console.log(error);
  }

  try {
    await weblancerScrapClick('wholesite');
  } catch (error) {
    console.log(error);
  }

  // *****************************
  // идем в раздел cms
  try {
    await nightmare.click('.navbar-nav .category_tree > li:nth-child(6) ul.collapse > li:nth-child(5) a').wait('.page_content .cols_table');
  } catch (error) {
    console.log(error);
  }

  try {
    await weblancerScrapClick('cms');
  } catch (error) {
    console.log(error);
  }
}
// weblancerClick();

// ? weblancerCheerio*********************************************************
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
  console.log(projects);

  return projects;
}
async function weblancerCheerio() {
  let resultProjects = [];

  const url = 'https://www.weblancer.net';
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
  for (let i = 1; i < 2; i++) {
    let response = await fetch(categoryLinks[i].link);
    response = await response.buffer();
    let data = iconv.decode(response, 'cp1251').toString();
    // console.log(data);

    $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

    // собираем проекты с первой страницы, мы на ней находимся
    try {
      resultProjects = [...resultProjects, ...(await weblancerScrapCheerio($, url))];
    } catch (error) {
      console.log(error);
    }

    // пробегаемся по оставшимся страницам и собираем проекты
    let isNextDisabled = false;
    let isNextExists = !!$('.pagination_box').length;
    if (!isNextExists) {
      console.log('next disabled', true, 'next exists', isNextExists);
      console.log(resultProjects.length);
      weblancerProjects[categoryLinks[i].title] = resultProjects;
      resultProjects = [];
      continue;
    }

    while (!isNextDisabled) {
      isNextDisabled = $('.pagination_box .text-center a.active + a').length ? false : true;
      console.log('next disabled', isNextDisabled, 'next exists', isNextExists);

      if (isNextDisabled) break;

      let nextLink = `${url}${$('.pagination_box .text-center a.active + a').attr('href')}`;
      console.log(nextLink);

      if (isNextExists && !isNextDisabled) {
        // задержка между запросами, чтобы не спамить слишком быстро
        await new Promise((resolve) => setTimeout(resolve, 1500));

        let response = await fetch(nextLink);
        response = await response.buffer();
        let data = iconv.decode(response, 'cp1251').toString();
        $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });
      }

      try {
        resultProjects = [...resultProjects, ...(await weblancerScrapCheerio($, url))];
      } catch (error) {
        console.log(error);
      }
    }

    console.log(resultProjects.length);
    weblancerProjects[categoryLinks[i].title] = resultProjects;
    resultProjects = [];
  }
}
// weblancerCheerio();

// ! ************************************************************************
// ! ************************************************************************
// freelance-habr***********************************************************

// ? flhabrLinksCheerio*********************************************************
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
async function flhabrLinksCheerio() {
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
      await nightmare.goto(categoryLinks[i].link).wait('#tasks_list');

      const data = await nightmare.evaluate(() => {
        return document.body.innerHTML;
      });

      $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

      // собираем проекты с первой страницы, мы на ней находимся
      try {
        resultProjects = [...resultProjects, ...(await flhabrScrapLinksCheerio($, url))];
      } catch (error) {
        console.log(error);
      }
      // console.log(resultProjects);

      // пробегаемся по оставшимся страницам и собираем проекты
      let isNextDisabled = false;
      let isNextExists = !!$('.pagination').length;
      if (!isNextExists) {
        console.log('next disabled', true, 'next exists', isNextExists);
        console.log(resultProjects.length);
        flhabrProjects[categoryLinks[i].title] = resultProjects;
        resultProjects = [];
        continue;
      }

      while (!isNextDisabled) {
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
          console.log(error);
        }
      }

      console.log(resultProjects.length);
      flhabrProjects[categoryLinks[i].title] = resultProjects;
      resultProjects = [];
    }
  } catch (error) {
    console.log(error);
  }
}
// flhabrLinksCheerio();

// ! ************************************************************************
// ! ************************************************************************
// freelance-ru***********************************************************

// ? freelanceruLinksCheerio*********************************************************
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
async function freelanceruLinksCheerio() {
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
      await nightmare.goto(categoryLinks[i].link).wait('.projects.projects-filtered').wait(1000);

      const data = await nightmare.evaluate(() => {
        return document.body.innerHTML;
      });

      $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

      // собираем проекты с первой страницы, мы на ней находимся
      try {
        resultProjects = [...resultProjects, ...(await freelanceruScrapLinksCheerio($, url))];
      } catch (error) {
        console.log(error);
      }

      // пробегаемся по оставшимся страницам и собираем проекты
      let isNextDisabled = false;
      let isNextExists = !!$('.pagination').length;
      if (!isNextExists) {
        console.log('next disabled', true, 'next exists', isNextExists);
        console.log(resultProjects.length);
        freelanceruProjects[categoryLinks[i].title] = resultProjects;
        resultProjects = [];
        continue;
      }

      while (!isNextDisabled) {
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
          console.log(error);
        }
      }

      console.log(resultProjects.length);
      freelanceruProjects[categoryLinks[i].title] = resultProjects;
      resultProjects = [];
    }
  } catch (error) {
    console.log(error);
  }
}
// freelanceruLinksCheerio();

// ! ************************************************************************
// ! ************************************************************************
// fl-ru***********************************************************

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

  $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

  // собираем проекты с первой страницы, мы на ней находимся
  try {
    resultProjects = [...resultProjects, ...(await flruClickCheerioObjects($, url))];
  } catch (error) {
    console.log(error);
  }
  // пробегаемся по оставшимся страницам и собираем проекты
  let isNextDisabled = false;
  let isNextExists = !!$('.b-pager__list').length;
  let pageCount = 1;
  if (!isNextExists) {
    console.log('next disabled', true, 'next exists', isNextExists);
    console.log(resultProjects.length);
    flruProjects[section] = resultProjects;
    resultProjects = [];
  }

  while (!isNextDisabled) {
    isNextDisabled = $('.b-pager__list li.b-pager__item_active + li').length ? false : true;
    console.log('next disabled', isNextDisabled, 'next exists', isNextExists);

    if (!isNextExists || isNextDisabled) break;

    let nextLink = `${url}/projects${$('.b-pager__list li.b-pager__item_active + li a').attr('href')}`;
    console.log(nextLink);

    // тормозим цикл, если слишком много страниц
    pageCount++;
    if (pageCount > 2) break;

    if (isNextExists && !isNextDisabled) await nightmare.goto(nextLink).wait('.b-post').wait('#pf_specs .b-ext-filter__krest').wait(1000);

    const data = await nightmare.evaluate(() => {
      return document.body.innerHTML;
    });

    $ = cheerio.load(data, { normalizeWhitespace: true, decodeEntities: false });

    try {
      resultProjects = [...resultProjects, ...(await flruClickCheerioObjects($, url))];
    } catch (error) {
      console.log(error);
    }
  }

  console.log(resultProjects.length);
  flruProjects[section] = resultProjects;
  resultProjects = [];
}
async function flruClickCheerio() {
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
    console.log(error);
  }

  try {
    await flruScrapClickCheerio('webprog', url);
  } catch (error) {
    console.log(error);
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
    console.log(error);
  }

  try {
    await flruScrapClickCheerio('html', url);
  } catch (error) {
    console.log(error);
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
    console.log(error);
  }

  try {
    await flruScrapClickCheerio('wholesite', url);
  } catch (error) {
    console.log(error);
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
    console.log(error);
  }

  try {
    await flruScrapClickCheerio('cms', url);
  } catch (error) {
    console.log(error);
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
    console.log(error);
  }

  try {
    await flruScrapClickCheerio('inetshop', url);
  } catch (error) {
    console.log(error);
  }
}
// flruClickCheerio();
