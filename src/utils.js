const waitForElement = (selector, time) => {
  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(intervalId);
        resolve(element);
      }
    }, time);
  });
};

const setValueToLocalStorage = (key, value) => {
  return new Promise((resolve, reject) => {
    // https://share.bito.co/static/share?aid=758fea78-99b6-4b1b-a6da-61a32b136739
    // se crea la constiable data, para  evitar que key sea tomado como "key" y en vez de ello toma el valor enviado
    const data = {};
    data[key] = value;

    chrome.storage.local.set(data, () => {
      if (!chrome.runtime.lastError) {
        resolve(true);
      } else {
        reject(chrome.runtime.lastError);
      }
    });
  });
};

const getValueFromLocalStorage = (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (!chrome.runtime.lastError) {
        resolve(result[key] ?? null);
      } else {
        reject(chrome.runtime.lastError);
      }
    });
  });
};

const removeValueFromLocalStorage = (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(key, () => {
      if (!chrome.runtime.lastError) {
        resolve(true);
      } else {
        reject(chrome.runtime.lastError);
      }
    });
  });
};
