/* this script initlizes the necesary value to start scrapping */
import { mkdir } from 'files-js';
import ProxyRotator from 'proxy-rotator-js'
import Checklist from 'checklist-js';
import Storage from 'dstore-js';

const mongo_url = 'mongodb://10.0.10.5:27017'; // vpn
//const mongo_url = 'mongodb://0.0.0.0:27017';
const mongo_database = 'supercias';

const makeFileStorage = async (fileStore_name) => {
    /* make storage to store pdfs */
    // Create a storage
    let fileStorage = new Storage({
        type: 'mongoFiles',
        url: mongo_url,
        database: mongo_database,
    });
    // Create a file
    let fileStore = await fileStorage.open(fileStore_name);
    return fileStore;
}

const makeCompanyStore = async store_name => {
    /* make a store to store the companies */
    // Create a storage
    let storage = new Storage({
        type: 'mongodb',
        url: mongo_url,
        database: mongo_database,
    });
    // open the store
    let store = await storage.open(store_name);
    // return store
    return store;
}

const getRucsToScrap = async () => {
    /* read storage to get the rucs to scrap */
    // Create a storage
    let store = new Storage({
        type: 'mongodb',
        url: mongo_url,   
        database: mongo_database,
    });
    // open the store
    let checklist_store = await store.open('ranking');
    // get the companies that have activos greater then 500k
    let rucs_to_scrap = await checklist_store.get({
        //"ruc": "1790319857001", // for testing
        //"activos": { $gt: 500000 }
    })
    // close the store
    await checklist_store.close();
    // format the rucs to scrap
    rucs_to_scrap = rucs_to_scrap.map( r => ({ "id": r.expediente, "ruc": r.ruc, "name": r.nombre }) );
    return rucs_to_scrap;
}

const makeChecklist = async rucs_to_scrap => {
    /* make a checklist with the rucs to scrap */
    mkdir('./storage/checklists');
    // Read the file
    let checklist = new Checklist(
        rucs_to_scrap, {
        name: 'companies_rucs',
        path: './storage/checklists',
        recalc_on_check: false,
        save_every_check: 1,
    });
    // return the checklist
    return checklist;
}

const init = async () => {
    // get a lsit of cedulas from mongodb
    let rucs_to_scrap = await getRucsToScrap();
    console.log('cedulas to scrap:', rucs_to_scrap.length);
    // make a store
    let store = await makeCompanyStore('administradores_checklist')
    // make checklist dir
    let checklist = await makeChecklist(rucs_to_scrap);   
    // check if the records are already in the store
    //await check_done_companies(store, checklist);
    // create a proxy rotator
    let proxies = new ProxyRotator('./storage/proxies/proxyscrape_premium_http_proxies.txt', {
        shuffle: true,
    });
    // make fileStore 
    let fileStore = await makeFileStorage('kardex_de_accionistas');
    // return values
    return {
        checklist,
        fileStore,
        store,
        proxies,
    }
}

export { init, makeFileStorage, makeCompanyStore, getRucsToScrap, makeChecklist };
