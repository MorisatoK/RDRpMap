const Language = {
  data: {},
  availableLanguages: ['de'],

  init: function () {
    'use strict';
    const langs = ['de'];

    if (Settings.language !== 'de') {
      langs.push(Settings.language);
    }

    const fetchTranslations = langs.map(async language => {
      const response = await fetch(
        `./langs/${language.replace('-', '_')}.json?nocache=${nocache}&date=${new Date().toISOUTCDateString()}`
      );
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} on ${response.url}. Failed to fetch translation data for ${language}`);
      }
      const json = await response.json();
      let result = {};

      for (const propName in json) {
        if (
          json[propName] !== '' &&
          (isEmptyObject(Language.data.de) ||
            Language.data.de[propName] !== json[propName])
        ) {
          result[propName] = json[propName];
        }
      }

      Language.data[language] = result;
    });

    return Promise.all(fetchTranslations).then(() => {
      this.setMenuLanguage();
    });
  },

  _links: {
    'GitHub': ['https://github.com/MorisatoK/RDRpMap/issues', 'GitHub'],
  },

  _externalLink: function (key) {
    'use strict';
    const [url, text] = Language._links[key];
    return `<a href="${url}" target="_blank">${text ? `${text}</a>` : ''}`;
  },

  get: function (transKey, optional) {
    'use strict';
    let translation = false;

    if (Language._links.propertyIsEnumerable(transKey)) {
      translation = Language._externalLink(transKey);
    } else if (transKey === 'int.end.link') {
      translation = '</a>';
    }

    if (translation) {
      translation = translation.replace('{0}', optional);
    } else if (Language.data[Settings.language] && Language.data[Settings.language][transKey]) {
      translation = Language.data[Settings.language][transKey];
    } else if (Language.data.de && Language.data.de[transKey]) {
      translation = Language.data.de[transKey];
    } else {
      translation = (optional ? '' : transKey);
    }

    return translation.replace(/\{([\w.]+)\}/g, (full, key) => {
      const translation = this.get(key);
      return translation === key ? `{${key}}` : translation;
    });
  },

  translateDom: function (context) {
    'use strict';
    Array.from((context || document).querySelectorAll('[data-text]')).forEach(
      (element) => {
        const string = Language.get(
          element.getAttribute('data-text'),
          element.dataset.textOptional
        );
        element.innerHTML = string.replace(/\{([\w.]+)\}/g, '---');
      }
    );

    return context;
  },

  setMenuLanguage: function () {
    'use strict';

    document.documentElement.setAttribute('lang', Settings.language);

    if (Language.data[Settings.language] === undefined) {
      const xhr = new XMLHttpRequest();
      xhr.open(
        'GET',
        `./langs/${Settings.language.replace('-', '_')}.json?nocache=${nocache}&date=${new Date().toISOUTCDateString()}`,
        false
      );
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            const json = JSON.parse(xhr.responseText);
            let result = {};

            for (const propName in json) {
              if (
                json[propName] !== '' &&
                (isEmptyObject(Language.data.en) ||
                  Language.data.en[propName] !== json[propName])
              ) {
                result[propName] = json[propName];
              }
            }

            Language.data[Settings.language] = result;
          } else {
            console.error(`Failed to fetch translation data for ${Settings.language}. Status code: ${xhr.status}`);
          }
        }
      };
      xhr.send();
    }

    this.translateDom();

    this._postTranslation();
  },

  hasTranslation: function (string) {
    return this.get(string) !== string;
  },

  _postTranslation: function () {
    document.getElementById('back-to-top').setAttribute('title', Language.get('menu.back_to_top'));

    Menu.updateFancySelect();
  }
};
