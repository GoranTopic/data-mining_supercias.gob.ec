import fs from 'fs';
import options from '../../src/options.json' assert { type: 'json' };

let debugging = options.debugging;

const download_pdf = async (url, page, path) => {
    let pdfString = await page.evaluate( async url => 
        new Promise( async (resolve, reject) => {
            let timeout = setTimeout(() => // 5 minutes
                reject("pdf fetch timeout"), 5 * 1000 * 60);
            const reader = new FileReader();
            //console.log('created reader')
            const response = await window.fetch(url);
            //console.log('response')
            const data = await response.blob();
            //console.log('made data')
            reader.onload = () => { 
                //console.log('promised resolved'); 
                resolve(reader.result)
            };
            reader.onerror = () => { 
                //console.log('promised rejected'); 
                reject('Error occurred while reading binary string')    
            };
            reader.readAsBinaryString(data);
        }), url
    );

    try{ 
        // save pdf binary string 
        const pdfData = Buffer.from(pdfString, 'binary');
        //let filename = path + ".pdf"
        
        fs.writeFileSync( path , pdfData);
        //if(debugging) console.log(`downloaded pdf: ${filename}`);
        return true;
    }catch(e){
        // did it downloaded
        console.error(`could not downloaded pdf: ${path}`, e);
        return false
    }
}

export default download_pdf