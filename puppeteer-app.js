const puppeteer = require('puppeteer');


const url = `https://winline.ru/stavki/sport/futbol/angliya/`;

async function pageInit() {
  const browser = await puppeteer.launch({
    'headless': false,
    // 'ignoreHTTPSErrors': true
  });
  const page = await browser.newPage();
  await page.setViewport({
    "width": 1280,
    "height": 720
  });
  

  await page.goto(url);

  await page.waitForSelector('.table.ng-scope');
  await page.waitFor(5000);
  const elems = await page.$$eval('.table__item.ng-scope', (eventElems) => {
    return Array.from(eventElems).map((elem) => {
      return {
        title: elem.querySelector('.statistic .statistic__match').getAttribute('title'),
        link: elem.querySelector('.statistic .statistic__match').href,

      }
    })
  });

  console.log(elems);
}

pageInit();