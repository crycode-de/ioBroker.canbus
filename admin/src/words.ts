/*
 * TypeScript replacement for words.js
 *
 * This file loads the translations directly from the i18n json files and also
 * adds TypeScript typings for the translate function `_('...')` defined
 * in lib/admin.d.ts.
 * Using this definitions it is ensured that all used translations in the react
 * context will be defined at least in the english translations file.
 *
 * TODO: add some type checks againts non-englisch translations files.
 */

import * as de from '../i18n/de/translations.json';
import * as en from '../i18n/en/translations.json';
import * as es from '../i18n/es/translations.json';
import * as fr from '../i18n/fr/translations.json';
import * as it from '../i18n/it/translations.json';
import * as nl from '../i18n/nl/translations.json';
import * as pl from '../i18n/pl/translations.json';
import * as pt from '../i18n/pt/translations.json';
import * as ru from '../i18n/ru/translations.json';
import * as zhcn from '../i18n/zh-cn/translations.json';

/* eslint-disable @typescript-eslint/no-unused-vars,@typescript-eslint/no-namespace */
declare global {
  namespace ioBroker {
    type AdminWords = keyof typeof en;
    type AdminSystemDictionary = Record<AdminWords, Record<ioBroker.Languages, string>>;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars,@typescript-eslint/no-namespace */

systemDictionary = {} as ioBroker.AdminSystemDictionary;

const keys = Object.keys(en) as ioBroker.AdminWords[];
for (const key of keys) {
  systemDictionary[key] = {
    ...systemDictionary[key],
    de: de[key],
    en: en[key],
    es: es[key],
    fr: fr[key],
    it: it[key],
    nl: nl[key],
    pl: pl[key],
    pt: pt[key],
    ru: ru[key],
    'zh-cn': zhcn[key]
  };
}
