import custom_ajax from './custom_code/custom_ajax.js';
import jsonfn from './custom_code/jsonfn.js';
import custom_functions from './custom_code/custom_functions.js';
import custom_eventListeners from './custom_code/custom_eventListeners.js';

const insert_custom_components = async page => {
    // insert custom compnenets  into the page
    await page.waitForFunction(`typeof PrimeFaces !== 'undefined'`)
    await page.evaluate(jsonfn);
    await page.evaluate(custom_ajax);
    await page.evaluate(custom_functions);
    await page.evaluate(custom_eventListeners);
    // return page
    return page;
}

export default insert_custom_components;
