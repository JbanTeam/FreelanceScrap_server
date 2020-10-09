const puppeteer = require('puppeteer');

let browser;
const url = `https://rs.ozon.ru/MDMCenter/Main/Entity/EntityExplorer.aspx?OrgId=1&CatalogId=4&OrgName=OZON&CatalogName=%D0%9E%D0%BF%D0%B8%D1%81%D0%B0%D1%82%D0%B5%D0%BB%D1%8C%D0%BD%D1%8B%D0%B9%20%D0%BA%D0%BE%D0%BD%D1%82%D0%B5%D0%B9%D0%BD%D0%B5%D1%80&PutCatalogAndOrdIdsInUserCache=true`;

const productsIds = '148296025,143711283,148302965';

async function puppeteerOzon() {
  // инициализируем браузер и страницу
  const page = await pageInit();
  
  // идем на озон и логинимся
  await ozonEnter(page);

  // идем по указанной ссылке, направляет в правильный описательный контейнер
  await page.goto(url);

  // ищем продукты по ID
  await searchProducts(page);

  // создаем массив объектов товаров
  const products = await createProductsObjects(page);
  console.log(products);

  for(let i = 0; i < 1; i++) {
    let product = products[i];
    await product.linkParentName.click();
    await page.waitFor(3000);
    product.techAttributes = [...await getProductTechAttributes()];

    await product.linkShortName.click();
    await page.waitFor(3000);
    product.generalAttributes = [...await getProductGeneralAttributes()];
  }
  console.log(products);
  // await browser.close();
};


// ******************************************************************************************************
// ******************************************************************************************************
// ******************************************************************************************************
async function pageInit() {
  browser = await puppeteer.launch({
    // 'args': ['--disable-web-security'],
    'headless': false,
    'ignoreHTTPSErrors': true
  });
  const page = await browser.newPage();
  await page.setViewport({
    "width": 1280,
    "height": 720
  });
  // console.log(page);
  return page;
}

async function ozonEnter(page) {
  // идем на озон
  await page.goto('https://rs.ozon.ru');
  // логинимся
  await page.waitFor('#login');
  await page.evaluate(() => {
    login.value = 'dvereshchagin';
    password.value = 'dvereshchagin';
  });
  await page.click('#btnlogin');
  await page.waitFor(3000);


  // await page.click('#lnkOrgCatalog');
  // await page.waitFor(3000);
  // // достаем фрэйм в котором всплывающая форма
  // let frames = await page.frames();
  // let myframe = frames.find(f => {
  //   return f.url().indexOf("OrgCatalogSelector.aspx?OrgId=0&CatalogId=0") > 0;
  // });
  // await myframe.$eval('#cboOrg_Input', input => input.value = 'OZON');
  // await myframe.$eval('#cboCatalog_Input', input => input.value = 'Описательный контейнер');
  // const saveBtn = await myframe.$('#btnSave');
  // await saveBtn.click();

  console.log('описательный контейнер');
}

async function searchProducts(page) {
  // ждем появления элемента с полями ввода
  await page.waitFor('#panelBarMiddleSearchPanels_i0_tblHeaderAttributeRules');
  // поиск одиночного товара
  // await page.$eval('#panelBarMiddleSearchPanels_i0_txtKeyword', input => input.value = '148296025');
  
  // поиск нескольких товаров
  // выбираем чекбокс общие атрибуты
  const generalCheckbox = await page.$('#panelBarMiddleSearchPanels_i0_chk_Commercial');
  generalCheckbox.click();
  console.log('checkbox clicked');

  // ждем кнопку добавить
  await page.waitFor(1000);
  const addRuleBtn = await page.$('#attributeSearchRuleButton .add-rule');
  await addRuleBtn.click();
  console.log('add rule clicked');
  // ждем поле ввода имени атрибута
  await page.waitForSelector('#divRule .Attributelookup');
  await page.waitFor(2000);

  // вводим имя атрибута
  const ruleInput = await page.$('#divRule .Attributelookup');
  ruleInput.type('ID Ozon SKU');
  // выбираем атрибут из выпадающего списка
  await page.waitForSelector('.lookup-container.gridParent td[title="ID Ozon SKU \[Общие атрибуты\] \[Common\]"]');
  const idOzonScu = await page.$('.lookup-container.gridParent td[title="ID Ozon SKU \[Общие атрибуты\] \[Common\]"]');
  await idOzonScu.click();
  // вводим Ids товаров
  await page.waitForSelector('#divRule .ruleattr-val .attr-val .attr-control');
  const ruleIdsInput = await page.$('#divRule .ruleattr-val .attr-val .attr-control');
  ruleIdsInput.type(productsIds);

  // нажимаем кнопку поиска
  await page.waitFor(1000);
  const searchBtn = await page.$('#panelBarMiddleSearchPanels_i0_btnSearch');
  searchBtn.click();

  await page.waitFor(2000);

  console.log('search products');
}

async function createProductsObjects(page) {
  // создаем объекты товаров
  await page.waitFor('#panelBarMiddleSearchPanels_i1_RSGrid1');
  let productsTableRows = await page.$$eval('#panelBarMiddleSearchPanels_i1_RSGrid1 table.rgMasterTable .rgRow, .rgAltRow', rows => {
    return rows.map((row) => {
      return {
        title: row.cells[3].innerText,
        linkShortName: row.cells[2].querySelector('a').href,
        linkParentName: row.cells[4].querySelector('a').href,
      }
    })
  });

  // console.log(productsTableRows[0].link);

  // присваиваем правильные ссылки
  for (let i = 0; i < productsTableRows.length; i++) {
    let row = productsTableRows[i];
    row.linkShortName = await page.$(`a[href="${row.linkShortName}"]`);
    row.linkParentName = await page.$(`a[href="${row.linkParentName}"]`);
  }

  console.log('products panel');

  return productsTableRows;
}

async function getProductTechAttributes() {
  // получаем открывшуюся страницу продукта
  const pages = await browser.pages();
  // console.log(pages);
  const productPage = pages[pages.length-1];
  await productPage.setViewport({
    "width": 1280,
    "height": 720
  });
  await productPage.waitFor(3000);
  await productPage.waitFor('.rpItem.rpLast .RadTreeView.RadTreeView_Office2007');
  // await productPage.waitFor('#NavigationRadPanelBar_i2_i0_trvStandardView .rtUl.rtLines');
  // получаем кнопку плюсик слева от "Технические атрибуты"
  const techAttributesPlusBtn = await productPage.$('.rpItem.rpLast .RadTreeView.RadTreeView_Office2007 > ul > li:nth-child(3) .rtMid .rtPlus');

  await techAttributesPlusBtn.click();

  await productPage.waitFor(3000);

  // получаем кнопку "Технические атрибуты"
  const techAttributesBtn = await productPage.$('.rpItem.rpLast .RadTreeView.RadTreeView_Office2007 > ul > li:nth-child(3) ul li:nth-child(4) .rtMid span.rtIn[title="Технические атрибуты"]');
  // console.log(techAttributesBtn);
  await techAttributesBtn.click();

  console.log('tech attributes clicked');

  // достаем фрэйм в котором таблица атрибутов
  await productPage.waitFor('#RAD_SPLITTER_PANE_EXT_CONTENT_ContentRadPane');
  await productPage.waitFor(8000);
  // const frame = await productPage.$('#RAD_SPLITTER_PANE_EXT_CONTENT_ContentRadPane');
  // console.log(frame);

  let frames = await productPage.frames();
  let attrsFrame = frames.find(f => {
    return f.name() === "ContentRadPane";
  });
  await attrsFrame.waitFor('#tblMain');
  const table = await attrsFrame.$('#tblMain');
  // console.log(table);

  // console.log('rownormal');

  const attributes = await table.$$eval('.rownormal, .rowhilite', rows => {
    return rows.map((row) => {
      return row.cells[1].innerText;
    });
  });
  console.log(attributes);
  productPage.close();
  return attributes;
}

async function getProductGeneralAttributes() {
  // получаем открывшуюся страницу продукта
  const pages = await browser.pages();
  // console.log(pages);
  const productPage = pages[pages.length-1];
  await productPage.setViewport({
    "width": 1280,
    "height": 720
  });
  await productPage.waitFor(3000);
  await productPage.waitFor('.rpItem.rpLast .RadTreeView.RadTreeView_Office2007');

  // получаем кнопку "Общие атрибуты"
  
  // await productPage.waitFor(3000);

  const generalAttributesBtn = await productPage.$('.rpItem.rpLast .RadTreeView.RadTreeView_Office2007 > ul > li:nth-child(2) ul > li:nth-child(4) .rtMid span.rtIn[title="Общие атрибуты"]');

  // console.log(generalAttributesBtn);
  await generalAttributesBtn.click();

  console.log('general attributes clicked');

  // достаем фрэйм в котором таблица атрибутов
  await productPage.waitFor('#RAD_SPLITTER_PANE_EXT_CONTENT_ContentRadPane');
  await productPage.waitFor(8000);
  // const frame = await productPage.$('#RAD_SPLITTER_PANE_EXT_CONTENT_ContentRadPane');
  // console.log(frame);

  let frames = await productPage.frames();
  let attrsFrame = frames.find(f => {
    return f.name() === "ContentRadPane";
  });
  await attrsFrame.waitFor('#tblMain');
  const table = await attrsFrame.$('#tblMain');
  // console.log(table);

  // console.log('rownormal');

  const attributes = await table.$$eval('.rownormal, .rowhilite', rows => {
    return rows.map((row) => {
      return row.cells[1].innerText;
    });
  });
  console.log(attributes);
  productPage.close();
  return attributes;
}

module.exports = {
  puppeteerOzon
}