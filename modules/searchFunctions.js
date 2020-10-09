const Nightmare = require('nightmare')
const nightmare = Nightmare({ show: true })
const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const utils = require('../utils')

let outputPath = ``;
let outputImagePath = ``;

// *********************************************************************************************************
// парсим каждый товар

async function scrapEvery(jsonFile, outputDir, parentDir) {
  if(outputDir === 'catalog') {
    outputPath = `output/${outputDir}/products/${parentDir}`;
    outputImagePath = `output/${outputDir}/images/${parentDir}`;
  } else {
    outputPath = `output/${outputDir}/products`;
    outputImagePath = `output/${outputDir}/images`;
  }

  const advancedResultItems = [];

  let obj = utils.readFileSync(`${outputPath}/${jsonFile}/${jsonFile}.json`)
  obj = JSON.parse(obj);
  console.log(obj);

  for(let i = 0; i < obj.length; i++) {
    let item = obj[i];
    let itemEnd = await nightmare
    .goto(item.href)
    .wait('.node-block #description')
    .evaluate(() => {
      const block = document.querySelector('#item-tabs-block .node-block');
      const sliderWrap = document.querySelector('#mainImageSliderWrap');
      const image = sliderWrap.querySelector('.owl-wrapper .owl-item:first-child .img img').getAttribute('data-original');
      const imageExt = image.slice(image.lastIndexOf('.'));

      return {
        imageOptions: {
          imagePath: image,
          imageExt
        },
        description: {
          title: block.querySelector('#description .price-item-description h2').innerText,
          desc : block.querySelector('#description .price-item-description p').innerText,
        }
      }

    });

    let itemEnd2 = await nightmare
    .click('li[data-tab-name="characteristics"]')
    .wait(700)
    .evaluate(() => {
      const block = document.querySelector('#item-tabs-block .node-block');
      return {
        characteristics: {
          title: block.querySelector('#characteristics .price_item_description h2').innerText,
          table: (() => {
            const table = block.querySelector('#characteristics .options-group .table-params');
            const rows = Array.from(table.querySelectorAll('tr'));

            let count = -1;
            const resultTableArr = [];
            for(let i= 0; i < rows.length; i++) {
              const tr = rows[i];
              if(tr.contains(tr.querySelector('.table-part'))) {
                count++;
                resultTableArr[count] = ({
                  title: tr.innerText,
                  rows: {}
                })
              } else {
                const tdArr = Array.from(tr.querySelectorAll('td'));
                let firstTd;
                let secondTd;
                tdArr.forEach((td) => {
                  if(td.contains(td.querySelector('.dots'))) {
                    firstTd = td.querySelector('.dots span').innerText;
                  } else {
                    secondTd = td.innerText;
                  }
                })
                resultTableArr[count].rows[firstTd] = secondTd;
              }
            }

            return resultTableArr;
          })()
        }
      }
    });

    // сохраняем картинку на диск
    await fetch(itemEnd.imageOptions.imagePath)
      .then(res => {
        if(!utils.dirExists(outputImagePath)) {
          utils.makeDir(outputImagePath);
        }
        if(!utils.dirExists(`${outputImagePath}/${jsonFile}`)) {
          utils.makeDir(`${outputImagePath}/${jsonFile}`);
        }
        
        let title = item.title.split(' ').join('_').replace(/[\"\"]/g, ''); // формируем название файла
        let imageLocalPath = path.join(__dirname, `../${outputImagePath}/${jsonFile}/${title}${itemEnd.imageOptions.imageExt}`); // локальный путь
        itemEnd.imageOptions.imageLocalPath = imageLocalPath;
        const dest = fs.createWriteStream(imageLocalPath);
        res.body.pipe(dest);
      });

    const itemLast = Object.assign({}, itemEnd, itemEnd2);
    advancedResultItems.push(itemLast);

    // пишем итоговый json файл
    if (!utils.dirExists(`${outputPath}/${jsonFile}`)) { //если файл или папка не существует
      utils.makeDir(`${outputPath}/${jsonFile}`) //то создаем
    }

    const json = JSON.stringify(advancedResultItems);
    utils.writeFileSync(`${outputPath}/${jsonFile}/${jsonFile}_advanced.json`, json);

  }
  await nightmare.end();
}

// ******************************************************************************************************
// парсим список товаров после поиска, собираем ссылки на каждый товар

async function search(searchQuery) {
  const url = `https://www.dns-shop.ru/search/?q=${searchQuery}`;

  await nightmare
  .goto(url)
  .wait('.products.catalog-products.view-list');

  const products = await nightmare
  .evaluate(() => {
    const productsList = document.querySelector('.products.catalog-products.view-list');
    const items = Array.from(productsList.querySelectorAll('.product')).map(el => {
      return {
        title: el.querySelector('.title h3').innerText,
        description: el.querySelector('.title span').innerText.replace(/\[|\]/g, ''),
        price: el.querySelector('.price_g span').innerText,
        href: el.querySelector('.title > a').href
      }
    })
    
    return items;
  })

  console.log(products);

  // пишем итоговый файл
  if (!utils.dirExists(`output/search/products/${searchQuery}`)) { //если файл или папка не существует
    utils.makeDir(`output/search/products/${searchQuery}`) //то создаем
  }

  const json = JSON.stringify(products);
  utils.writeFileSync(`output/search/products/${searchQuery}/${searchQuery}.json`, json);

  await nightmare.end();


}

module.exports = { scrapEvery, search };