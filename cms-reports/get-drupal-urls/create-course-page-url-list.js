const puppeteer = require('puppeteer');
const fs = require('fs');
const yargs = require("yargs");

educationURLSFile_txt = 'educationURLS.txt'
educationURLSFile_json = 'educationURLS.json'
pageHrefs = [];
hrefs = [];

async function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchURLS(domainURL, domain) {

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({ width: 1300, height: 5000 });
        await page.goto(domainURL + '/courses/undergraduate');
        await timeout(2000);

        var UG = await page.$$eval('a', links => links.map(a => a.href));

        await page.goto(domainURL + '/courses/postgraduate-taught');
        await timeout(2000);

        //console.log(UG.toString().split(','));

        var UGURLS = [];
        for (let i = 0; i < UG.length; i++) {
            UGURLS[i] = ['UG', UG[i]];
        }

        PGT = await page.$$eval('a', links => links.map(a => a.href));

        var PGTURLS = [];
        for (let i = 0; i < PGT.length; i++) {
            PGTURLS[i] = ['PGT', PGT[i]];
        }

        pageHrefs = UGURLS.concat(PGTURLS);
        browser.close();

    } catch (err) {

        // an error can cause a promise to hang or unpredicatable results (needs investigation)
        // so best to kill the process           
        console.log(err);
        process.exit(1);
    };

    for (let i = 0; i < pageHrefs.length; i++) {

        found = false;

        if (pageHrefs[i][1].indexOf('/courses/') >= 0) {

            if ((pageHrefs[i][1].indexOf('.page') == -1) && (pageHrefs[i][1].indexOf('#') == -1) && (pageHrefs[i][1].indexOf('undergraduate') == -1) && (pageHrefs[i][1].indexOf('postgraduate') == -1)) {
                found = true;
            };
        };

        if (found) {
            var URL = pageHrefs[i][1].split('uk');
            pageHrefs[i][1] = URL[1];

            hrefs.push(pageHrefs[i]);
            console.log(pageHrefs[i][1]);
        }


    }

    //write json file
    const reportString = JSON.stringify(hrefs, null, 3);
    fs.writeFileSync('../url-lists/course-page-urls-' + domain + '.json', reportString);

    //write text file 
    fs.writeFileSync('../url-lists/course-page-urls-' + domain + '.txt', hrefs.toString());

    console.log('Found ' + hrefs.length + ' URLs');
    console.log('');
}




const argv = yargs
    .options("domain", {
        alias: "d",
        description: "Drupal domain to scrape (prod, pprd, live",
        type: "string",
    })
    //.choices("s", settings)
    .default("d", 'prod')
    .help()
    .alias("help", "h").argv;

var domainURL;

switch (argv.domain) {
    case 'prod':
        console.log('Fetching URLs from OneWeb prod domain');
        domainURL = 'https://oneweb.soton.ac.uk';
        domain = 'prod';
        break;

    case 'pprd':
        console.log('Fetching URLs from OneWeb pprd domain');
        domainURL = 'https://oneweb.pprd.soton.ac.uk';
        domain = 'pprd';
        break;

    case 'live':
        console.log('Fetching URLs from external domain');
        domainURL = 'https://www.southampton.ac.uk';
        domain = 'live';
        break;

    case 'dev':
        console.log('Fetching URLs from dev domain');
        domainURL = 'https://oneweb.dev.soton.ac.uk';
        domain = 'dev';
        break;

    case 'drupal9':
        console.log('Testing external domain');
        domainURL = 'https://drupal9.soton.ac.uk';
        domain = 'drupal9';
        break;


}

fetchURLS(domainURL, domain);