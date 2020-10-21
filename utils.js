const fs = require('fs');
const path = require('path');

function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

function dirExists(dirPath) {
  return fs.existsSync(path.join(__dirname, dirPath));
}

function makeDir(dirPath) {
  fs.mkdirSync(path.join(__dirname, dirPath));
}

function writeFileSync(filePath, fileData) {
  fs.writeFileSync(path.join(__dirname, filePath), fileData, (err) => {
    console.log('Done!');
  });
}

function readFileSync(filePath) {
  return fs.readFileSync(path.join(__dirname, filePath), 'utf-8');
}

function makeTitleFromUrl(url) {
  if (url.includes('?')) {
    url = url.slice(0, url.lastIndexOf('?'));
  }
  let linkParts = url.split('/').filter((item) => {
    return item !== '';
  });

  let title = linkParts[linkParts.length - 1];
  return title;
}

// если нужно вернуть массив с новыми элементами, то первым аргументом передаем старый массив
// если нужно вернуть массив с элементами котых уже нет в новом массиве, то первым передаем новый массив
function diff(prevArr, newArr) {
  let arr = [];
  prevArr.forEach((obj1) => {
    arr.push(obj1.link);
  });
  return newArr.filter((obj2) => {
    return arr.indexOf(obj2.link) === -1;
  });
}

// фильтрует удаленные объекты, возвращает массив ссылок удаленных объектов
function diff2(prevArr, newArr) {
  let arr = [];
  let arr2 = [];
  prevArr.forEach((obj1) => {
    arr.push(obj1.link);
  });
  newArr.forEach((obj1) => {
    arr2.push(obj1.link);
  });

  return arr2.filter((link) => {
    return arr.indexOf(link) === -1;
  });
}

function copyArrOfObjects(arr) {
  return arr.map((obj) => Object.assign({}, obj));
}

function deepCloneObject(obj) {
  const clObj = {};
  for (const i in obj) {
    if (obj[i] instanceof Object) {
      if (Array.isArray(obj[i])) {
        clObj[i] = obj[i].map((item) => {
          if (item instanceof Object) {
            return deepCloneObject(item);
          } else {
            return item;
          }
        });
      } else {
        clObj[i] = deepCloneObject(obj[i]);
      }
      continue;
    }
    clObj[i] = obj[i];
  }
  return clObj;
}

function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}

module.exports = {
  getKeyByValue,
  diff,
  diff2,
  copyArrOfObjects,
  deepCloneObject,
  fileExists,
  dirExists,
  makeDir,
  writeFileSync,
  readFileSync,
  makeTitleFromUrl,
};
