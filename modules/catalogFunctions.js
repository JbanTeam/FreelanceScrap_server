const Nightmare = require('nightmare');
const nightmare = Nightmare({
  show: true,
});
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const utils = require('../utils');

// const searchQuery = `noutbuki`;
// const url = `https://www.dns-shop.ru/catalog/17a892f816404e77/${searchQuery}/?order=1&groupBy=none&stock=2`;

const catalogUrl = `https://www.dns-shop.ru/catalog/`;
const resultArrLinks = {};
const resultArrObjRecur = [];
let productsPath = `output/catalog/products`;

// **********************************************************************************************
// собираем все ссылки на каталоги

async function scrapAllCatalogLinks() {
  const mainLinks = await nightmare
    .goto(catalogUrl)
    .wait('.catalog-content-desktop')
    .evaluate(() => {
      const mainLinks = Array.from(document.querySelectorAll('.catalog-category')).map((link) => {
        return `https://www.dns-shop.ru${link.querySelector('h4 a').getAttribute('href')}`;
      });
      return mainLinks;
    });

  // console.log(mainLinks);
  const titles = [];
  for (let i = 16; i < 17; i++) {
    const link = mainLinks[i];

    let title = utils.makeTitleFromUrl(link);
    titles.push({
      title,
      link,
    });

    await checkNextCatalog(link, link, title);

    const json = JSON.stringify(resultArrLinks);
    utils.writeFileSync(`output/catalog/${title}.json`, json);
  }

  await nightmare.end();

  // const json = JSON.stringify(titles);
  // utils.writeFileSync(`output/catalog/mainLinks.json`, json);

  // const json = JSON.stringify(resultArrLinks);
  // utils.writeFileSync(`output/catalog/catalogs.json`, json);
}

// **********************************************************************************************
// парсим список товаров в каталоге, собираем ссылки на каждый товар

async function scrapCatalog(jsonFile) {
  let resultItems = [];
  let end = false;

  // читаем json файл из ./output/catalog
  let obj = utils.readFileSync(`output/catalog/${jsonFile}.json`);
  obj = JSON.parse(obj);

  for (let i = 0; i < 1; i++) {
    const url = obj[jsonFile].arr[i];

    await nightmare.goto(url).wait('.catalog-items-list.view-list');
    let isNextDisabled = false;
    let isNextExists = await nightmare.exists('.item.next');

    while (!isNextDisabled && !end) {
      !isNextExists ? (isNextDisabled = true) : (isNextDisabled = await nightmare.exists('.disabled.item.next'));

      let items = await nightmare.wait('.catalog-items-list.view-list').evaluate(() => {
        const items = Array.from(document.querySelectorAll('.catalog-items-list.view-list .item')).map((el) => {
          return {
            title: el.querySelector('.title h3').innerText,
            description: el.querySelector('.title span').innerText.replace(/\[|\]/g, ''),
            price: el.querySelector('.price_g span').innerText,
            href: el.querySelector('.title > a').href,
          };
        });

        return items;
      });
      resultItems = [...resultItems, ...items];

      items = [];

      if (isNextExists) await nightmare.click('.item.next').wait(5000);

      if (isNextDisabled) {
        end = true;
      }
      console.log('next', isNextDisabled, 'end', end);
    }
    await nightmare.end();
    console.log(resultItems.length);

    let title = utils.makeTitleFromUrl(url);

    // пишем итоговый json файл
    if (!utils.dirExists(`${productsPath}/${jsonFile}`)) {
      //если файл или папка не существует
      utils.makeDir(`${productsPath}/${jsonFile}`); //то создаем
    }
    if (!utils.dirExists(`${productsPath}/${jsonFile}/${title}`)) {
      //если файл или папка не существует
      utils.makeDir(`${productsPath}/${jsonFile}/${title}`); //то создаем
    }

    const json = JSON.stringify(resultItems);
    utils.writeFileSync(`${productsPath}/${jsonFile}/${title}/${title}.json`, json);
  }
}

// **********************************************************************************************
// для рекурсвиного прохода каталогов

async function checkNextCatalog(link, mainLink, title) {
  // return promise

  return new Promise(async (resolve, reject) => {
    await nightmare.goto(link);
    let isPageWithCatalogs = await nightmare.exists('.category-items-desktop a.category-item-desktop');

    let linksArr = [];
    if (isPageWithCatalogs) {
      console.log('page with catalogs');
      linksArr = await nightmare.wait('.category-items-desktop').evaluate(() => {
        const links = [...document.querySelectorAll('.category-items-desktop a.category-item-desktop')].map((link) => {
          return `https://www.dns-shop.ru${link.getAttribute('href')}`;
        });
        return links;
      });

      for (let i = 0; i < linksArr.length; i++) {
        const link = linksArr[i];
        console.log('link', link);
        const result = await checkNextCatalog(link, mainLink, title);
        console.log(result);
        if (typeof result === 'string') {
          !resultArrLinks[title]
            ? (resultArrLinks[title] = {
                title,
                mainLink,
                arr: [],
              })
            : resultArrLinks[title].arr.push(link);
        }
      }
    } else {
      resolve('no catalogs');
    }

    resolve(linksArr);
  });
}

module.exports = {
  scrapAllCatalogLinks,
  scrapCatalog,
};

// recursionFunc('https://www.dns-shop.ru/catalog/17a890dc16404e77/smartfony-i-smart-chasy/')
// .then(() => {
//   nightmare.end()
//   .then(() => {
//     /* Object.keys(resultArr[0]).forEach((key) => {
//       // console.log(typeof resultArr[0][key]);
//       const obj = {};
//       if(Array.isArray(resultArr[0][key])) {
//         for (const link of resultArr[0][key]) {

//         }
//       }
//     }) */

//     const json = JSON.stringify(resultArrLinks);
//     fs.writeFileSync(path.join(__dirname, `11.json`), json, (err) => {
//       console.log('Done!');
//     })
//   })
// })
