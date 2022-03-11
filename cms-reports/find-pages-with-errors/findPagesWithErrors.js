const fs = require('fs');
const puppeteer = require('puppeteer');
const urlGenerator = require('../local-modules/site-urls');
const yargs = require("yargs");
const htmlFunctions = require('../local-modules/html-functions');
const globalSettings = require('../local-modules/report-settings');
const { exit } = require('process');

//global variables
var pagesWithErrors = [];
var siteURLS = '';

const REPORTS_DATA_FOLDER = globalSettings.getReportsFolder();

async function generateReport(urllimit, domain, debug) {

    if (urllimit == 0) {
        urllimit = siteURLS.length
    }

    console.log('');
    console.log('Finding pages which throw an error for ' + urllimit + ' pages:');

    var browser;
    var page;

    //open the browser and use one page to get the data
    //much quicker
    try {
        browser = await puppeteer.launch();
        page = await browser.newPage();
        //await page.setViewport({ width: 1300, height: 5000 });
    } catch (error) {
        console.log('Unable to startup browser ' + error);
        exit;
    }

    for (let i = 0; i < urllimit; i++) {
        let pageURL = siteURLS[i].toString();

        //output progress
        console.log(i + " - " + pageURL);

        try {

            // setup the browser and go to the test url
            //browser = await puppeteer.launch();
            try {
                await page.goto(pageURL);
            } catch (error) {
                console.log(error);
                browser.close();
                browser = await puppeteer.launch();
                page = await browser.newPage();
            }
            
            
            var textToFind = 'The website encountered an unexpected error. Please try again later.';
            found = await page.evaluate((textToFind) => window.find(textToFind), textToFind);

            if (found) {

                //var placeholder1 = await page.evaluate(() => Array.from(document.querySelectorAll('body > em:nth-child(3)'), element => element.textContent));
                //var placeholder2 = await page.evaluate(() => Array.from(document.querySelectorAll('body > em:nth-child(4)'), element => element.textContent));
                //var placeholder3 = await page.evaluate(() => Array.from(document.querySelectorAll('body > em:nth-child(5)'), element => element.textContent));
                //var placeholder4 = await page.evaluate(() => Array.from(document.querySelectorAll('body > em:nth-child(6)'), element => element.textContent));
                //var backtrace = await page.evaluate(() => Array.from(document.querySelectorAll('body > pre'), element => element.textContent));
                
                //var placeholder = placeholder1.toString().placeholder2.toString().placeholder3.toString().placeholder4.toString();

                var error = await page.evaluate(() => Array.from(document.querySelectorAll('body'), element => element.textContent));
                //var errorText = error.toString().replace('\n', '<br>');
                
                
                //console.log(error.length);
                var errorText = '';
                error.forEach(line => {
                    errorText = errorText + '<br><br>' + line.toString();
                });

                //var error = placeholder + '<br><br>' + backtrace.toString();

                pagesWithErrors.push([pageURL, errorText]);
                //console.log(error);

            }

        } catch (err) {

            console.log(err);
            await page.close();
        };
    }
    await browser.close();
}

async function runner_GenerateReport(urllimit, domain, debug) {

    //add header to report
    pagesWithErrors.push(['Pages with an error', 'Error and backtrace']);

    //fetch the data
    await generateReport(urllimit, domain, debug);

    //setup today's data and time for the report
    var today = new Date();
    today = today.toDateString() + ' ' + today.toLocaleTimeString();

    //create html report
    var htmlReport = '';
    htmlReport += '<html><head></head><body>';
    htmlReport += '<h1>Digital UX - Pages failing with an error</h1>';
    htmlReport += '<h2>Report date : ' + today + '</h2>';
    htmlReport += '<hr>';
    htmlReport += '<div>The list below contains pages with an error. </div>';
    //htmlReport += '<br>';
    htmlReport += '<br>';
    htmlReport += htmlFunctions.generateTable(pagesWithErrors);
    htmlReport += '<br>';
    fs.writeFileSync(REPORTS_DATA_FOLDER + 'drupal/pages-with-errors/html/pages-with-an-error.html', htmlReport);
  
}


const argv = yargs
    .options("domain", {
        alias: "d",
        description: "Drupal domain to use (prod, pprd, dev, live, other",
        type: "string",
    })
    .options("urllimit", {
        alias: "u",
        description: `Set maximum number of URLs (test mode); defaults to 0 for all URLs`,
        type: "string"
    })
    .options("gebug", {
        alias: "g",
        description: "Turn on page debugger",
        type: "string"
    })
    .default("u", 0)
    .default("f", '')
    .default("gebug", 'false')
    .demandOption(["domain"], "Please specify a domain (prod, pprd, dev, live, other)")
    .help()
    .alias("help", "h").argv;


if (argv.gebug == 'true') {
    console.log('Debug has been turned on');
} 

//get the course page URLs for this domain
siteURLS = urlGenerator.getFullRegressionTestURLs(argv.domain);
//siteURLS = ['https://oneweb.soton.ac.uk/study/subjects/geography-environmental-science', 'https://www.southampton.ac.uk/courses/modules/sesa3030', 'https://oneweb.soton.ac.uk/courses/chemical-engineering-degree-meng'];

//run the report
runner_GenerateReport(argv.urllimit, argv.domain, argv.gebug);

