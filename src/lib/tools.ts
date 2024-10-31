import axios, { type AxiosError } from 'axios';

/**
 * Tests whether the given variable is a real object and not an Array
 * @param it The variable to test
 */
export function isObject (it: unknown): it is Record<string, unknown> {
  // This is necessary because:
  // typeof null === 'object'
  // typeof [] === 'object'
  // [] instanceof Object === true
  return Object.prototype.toString.call(it) === '[object Object]';
}

/**
 * Tests whether the given variable is really an Array
 * @param it The variable to test
 */
export function isArray (it: unknown): it is unknown[] {
  if (Array.isArray !== null) return Array.isArray(it);
  return Object.prototype.toString.call(it) === '[object Array]';
}

/**
 * Translates text using the Google Translate API
 * @param text The text to translate
 * @param targetLang The target language
 * @param yandexApiKey The yandex API key. You can create one for free at https://translate.yandex.com/developers
 */
export async function translateText (text: string, targetLang: string, yandexApiKey?: string): Promise<string> {
  if (targetLang === 'en') {
    return text;
  } else if (!text) {
    return '';
  }
  if (yandexApiKey) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return await translateYandex(text, targetLang, yandexApiKey);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return await translateGoogle(text, targetLang);
  }
}

/**
 * Translates text with Yandex API
 * @param text The text to translate
 * @param targetLang The target language
 * @param apiKey The yandex API key. You can create one for free at https://translate.yandex.com/developers
 */
async function translateYandex (text: string, targetLang: string, apiKey: string): Promise<string> {
  if (targetLang === 'zh-cn') {
    targetLang = 'zh';
  }
  try {
    const url = `https://translate.yandex.net/api/v1.5/tr.json/translate?key=${apiKey}&text=${encodeURIComponent(text)}&lang=en-${targetLang}`;
    const response = await axios.request<{ text?: string[] }>({ url, timeout: 15000 });
    if (isArray(response.data?.text)) {
      return response.data.text[0];
    }
    throw new Error('Invalid response for translate request');
  } catch (e) {
    throw new Error(`Could not translate to "${targetLang}": ${e}`);
  }
}

/**
 * Translates text with Google API
 * @param text The text to translate
 * @param targetLang The target language
 */
async function translateGoogle (text: string, targetLang: string): Promise<string> {
  try {
    const url = `http://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}&ie=UTF-8&oe=UTF-8`;
    const response = await axios.request<string[][][]>({ url, timeout: 15000 });
    if (isArray(response.data)) {
      // we got a valid response
      return response.data[0][0][0];
    }
    throw new Error('Invalid response for translate request');
  } catch (e) {
    if ((e as AxiosError).response?.status === 429) {
      throw new Error(
        `Could not translate to "${targetLang}": Rate-limited by Google Translate`,
      );
    } else {
      throw new Error(`Could not translate to "${targetLang}": ${e}`);
    }
  }
}
