import setup_browser from './scripts/setup_browser.js';
import scrap_company from './scripts/scrap_company.js';
import close_browser from './scripts/close_browser.js';
import Slaver from 'slavery-js';
import fileStore from './utils/fileStore.js';

Slaver({
    host: 'localhost',
    port: 3000,
    crashOnError: true,
    numberOfSlaves: 1,
}).slave(async ({ company, proxy }) => {
    let browser = null;
    let data = null;
    // set up browser
    console.log('setting up browser');
    browser = await setup_browser(proxy);
    // save fileStore in to the page
    (await browser.pages())[0]['fileStore'] = await fileStore();
    // scrap company
    console.log('scraping company');
    data = await scrap_company(browser, company);
    // close browser
    await close_browser(browser);
    // return data
    return ({ company, proxy, data });
});

