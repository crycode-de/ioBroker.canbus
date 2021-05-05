"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateText = exports.isArray = exports.isObject = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Tests whether the given variable is a real object and not an Array
 * @param it The variable to test
 */
function isObject(it) {
    // This is necessary because:
    // typeof null === 'object'
    // typeof [] === 'object'
    // [] instanceof Object === true
    return Object.prototype.toString.call(it) === '[object Object]';
}
exports.isObject = isObject;
/**
 * Tests whether the given variable is really an Array
 * @param it The variable to test
 */
function isArray(it) {
    if (Array.isArray != null)
        return Array.isArray(it);
    return Object.prototype.toString.call(it) === '[object Array]';
}
exports.isArray = isArray;
/**
 * Translates text using the Google Translate API
 * @param text The text to translate
 * @param targetLang The target language
 * @param yandexApiKey The yandex API key. You can create one for free at https://translate.yandex.com/developers
 */
async function translateText(text, targetLang, yandexApiKey) {
    if (targetLang === 'en') {
        return text;
    }
    else if (!text) {
        return '';
    }
    if (yandexApiKey) {
        return translateYandex(text, targetLang, yandexApiKey);
    }
    else {
        return translateGoogle(text, targetLang);
    }
}
exports.translateText = translateText;
/**
 * Translates text with Yandex API
 * @param text The text to translate
 * @param targetLang The target language
 * @param apiKey The yandex API key. You can create one for free at https://translate.yandex.com/developers
 */
async function translateYandex(text, targetLang, apiKey) {
    var _a;
    if (targetLang === 'zh-cn') {
        targetLang = 'zh';
    }
    try {
        const url = `https://translate.yandex.net/api/v1.5/tr.json/translate?key=${apiKey}&text=${encodeURIComponent(text)}&lang=en-${targetLang}`;
        const response = await axios_1.default({ url, timeout: 15000 });
        if (isArray((_a = response.data) === null || _a === void 0 ? void 0 : _a.text)) {
            return response.data.text[0];
        }
        throw new Error('Invalid response for translate request');
    }
    catch (e) {
        throw new Error(`Could not translate to "${targetLang}": ${e}`);
    }
}
/**
 * Translates text with Google API
 * @param text The text to translate
 * @param targetLang The target language
 */
async function translateGoogle(text, targetLang) {
    var _a;
    try {
        const url = `http://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}&ie=UTF-8&oe=UTF-8`;
        const response = await axios_1.default({ url, timeout: 15000 });
        if (isArray(response.data)) {
            // we got a valid response
            return response.data[0][0][0];
        }
        throw new Error('Invalid response for translate request');
    }
    catch (e) {
        if (((_a = e.response) === null || _a === void 0 ? void 0 : _a.status) === 429) {
            throw new Error(`Could not translate to "${targetLang}": Rate-limited by Google Translate`);
        }
        else {
            throw new Error(`Could not translate to "${targetLang}": ${e}`);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL3Rvb2xzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUUxQjs7O0dBR0c7QUFDSCxTQUFnQixRQUFRLENBQUMsRUFBVztJQUNsQyw2QkFBNkI7SUFDN0IsMkJBQTJCO0lBQzNCLHlCQUF5QjtJQUN6QixnQ0FBZ0M7SUFDaEMsT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssaUJBQWlCLENBQUM7QUFDbEUsQ0FBQztBQU5ELDRCQU1DO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsT0FBTyxDQUFDLEVBQVc7SUFDakMsSUFBSSxLQUFLLENBQUMsT0FBTyxJQUFJLElBQUk7UUFBRSxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDcEQsT0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssZ0JBQWdCLENBQUM7QUFDakUsQ0FBQztBQUhELDBCQUdDO0FBRUQ7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsYUFBYSxDQUFDLElBQVksRUFBRSxVQUFrQixFQUFFLFlBQXFCO0lBQ3pGLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtRQUN2QixPQUFPLElBQUksQ0FBQztLQUNiO1NBQU0sSUFBSSxDQUFDLElBQUksRUFBRTtRQUNoQixPQUFPLEVBQUUsQ0FBQztLQUNYO0lBQ0QsSUFBSSxZQUFZLEVBQUU7UUFDaEIsT0FBTyxlQUFlLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxZQUFZLENBQUMsQ0FBQztLQUN4RDtTQUFNO1FBQ0wsT0FBTyxlQUFlLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQzFDO0FBQ0gsQ0FBQztBQVhELHNDQVdDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxLQUFLLFVBQVUsZUFBZSxDQUFDLElBQVksRUFBRSxVQUFrQixFQUFFLE1BQWM7O0lBQzdFLElBQUksVUFBVSxLQUFLLE9BQU8sRUFBRTtRQUMxQixVQUFVLEdBQUcsSUFBSSxDQUFDO0tBQ25CO0lBQ0QsSUFBSTtRQUNGLE1BQU0sR0FBRyxHQUFHLCtEQUErRCxNQUFNLFNBQVMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFlBQVksVUFBVSxFQUFFLENBQUM7UUFDM0ksTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFLLENBQUMsRUFBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7UUFDcEQsSUFBSSxPQUFPLENBQUMsTUFBQSxRQUFRLENBQUMsSUFBSSwwQ0FBRSxJQUFJLENBQUMsRUFBRTtZQUNoQyxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzlCO1FBQ0QsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO0tBQzNEO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixVQUFVLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUNqRTtBQUNILENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsS0FBSyxVQUFVLGVBQWUsQ0FBQyxJQUFZLEVBQUUsVUFBa0I7O0lBQzdELElBQUk7UUFDRixNQUFNLEdBQUcsR0FBRywwRUFBMEUsVUFBVSxXQUFXLGtCQUFrQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztRQUN4SixNQUFNLFFBQVEsR0FBRyxNQUFNLGVBQUssQ0FBQyxFQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztRQUNwRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDMUIsMEJBQTBCO1lBQzFCLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUMvQjtRQUNELE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztLQUMzRDtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsSUFBSSxDQUFBLE1BQUEsQ0FBQyxDQUFDLFFBQVEsMENBQUUsTUFBTSxNQUFLLEdBQUcsRUFBRTtZQUM5QixNQUFNLElBQUksS0FBSyxDQUNiLDJCQUEyQixVQUFVLHFDQUFxQyxDQUMzRSxDQUFDO1NBQ0g7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsMkJBQTJCLFVBQVUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ2pFO0tBQ0Y7QUFDSCxDQUFDIn0=