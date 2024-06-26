import sanitize from '../../../utils/sanitizer.js';
import waitForNetworkIdle from '../../../utils/waitForNetworkIdle.js';
import send_request from '../../../reverse_engineer/send_request.js';
import { query_table_change } from '../../../reverse_engineer/queries/query_tables_change_general.js';
import scrap_pdf_row from './scrap_documents_pdf_row.js';
import options from '../../../options.js';


/**
 * scrap_table.
 * this is the piece of the strip that script that handle scraping a table o rows
 *
 * @param {} table
 * @param {} rows
 * @param {} checklists
 * @param {} page
 * @param {} company
 */
const scrap_table = async (table, rows, checklists, page, company) => {
    // switch table tab let's change the tab and get the total number of rows, 
    // except if it is the general row, in which case it is 
    console.log(`scraping ${table} Table`);
    
    console.log(`rows[${table}]: ${rows[table]}`);

    // add filters to the table
    console.log('adding filters table')
    await page.evaluate(({ table, filters }) => {
        // get filters values
        console.log(filters);
    
        const widget = PrimeFaces.widgets['tbl' + table];
        if (widget && widget.sortableColumns) {
            Object.values(filters).forEach((value, i) => {
                if (widget.sortableColumns[i]) {
                    widget.sortableColumns[i].childNodes[3].value = value;
                }
            });
            widget.filter();
        } else {
            console.log('El widget o las columnas ordenables no están definidos correctamente.');
        }
    }, { table, filters: options.documents[table].filters });

    // wait for table to load
    await waitForNetworkIdle(page, 1000);

    // don't try to scrap if the are no documents
    if(rows[table] === 0) return true
    // let make update the path 

    if (rows[table] > 10) {
        // get all rows
        console.log('sending query for rows all')
        await page.evaluate( ({ table, rows }) => { // paginator
                return PrimeFaces
                    .widgets['tbl' + table]
                    .paginator
                    .setRowsPerPage(rows)
            }, { table, rows: rows[table] }
        )
    }

    // wait for table to load
    await waitForNetworkIdle(page, 1000);

    // extract rows in table
    let pdfs_info = await page.evaluate( table =>
        // let get a list of all pdf documents
        // note: here the value is tab + table
        // instead of the ususal tbl + table
        window.parse_table_html('tbl' + table),
        table
    );

    // sanitize values
    //debugger;
    pdfs_info = pdfs_info.map( pdf => ({
        title: sanitize(pdf.title),
        id: pdf.id, // don't sanitize id
        fecha: pdf.date,
    }))

    // add pdfs documents to the checklist
    checklists[table].add(
        pdfs_info.map(pdf => pdf.id),
    );
    
    let downloaded = [];
    // loop over every pdf
    for (let { id, title, fecha } of pdfs_info) {
        // if we alread have it, skip it
        let arrayDatosDownloaded = [];
        let pdf_filename = options.files_path + company.ruc + '_' + table + '_' + title + '.pdf';
        if (checklists[table].isChecked(id))
        {
            arrayDatosDownloaded = {
                "NameDocumen" : pdf_filename,
                "fechaWeb" : fecha
            }
            downloaded.push(arrayDatosDownloaded); 
        } 
        console.log(`Downloading pdf ${checklists[table].missingLeft()}/${rows[table]} of ${table} in ${company.name} title: ${title}`)
        let outcome = await scrap_pdf_row(
            id,
            page,
            pdf_filename,
            console
        );
        if (outcome) {
            checklists[table].check(id);
            arrayDatosDownloaded = {
                "NameDocumen" : pdf_filename,
                "fechaWeb" : fecha
            }
            downloaded.push(arrayDatosDownloaded);
            console.log('Downloaded');
        } else 
            console.log('not downloaded');
        // wait for good luck
        await waitForNetworkIdle(page, 1000);
    }
    return downloaded;
}

export default scrap_table;
