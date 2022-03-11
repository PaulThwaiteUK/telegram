const fs = require('fs');
const puppeteer = require('puppeteer');
const URLs = require('../local-modules/SiteURLs');
const yargs = require("yargs");
const htmlFunctions = require('../local-modules/htmlFunctions');
const { exit } = require('process');

//global variables
var modules = [];
var moduleCodeCount = 0;
var moduleNameCount = 0;
var moduleURLCount = 0;
var minusCount = 0;

async function generateReport(urllimit, domainURL, domain, debug, listonly) {




    if (urllimit == 0) {
        urllimit = siteURLS.length
    }

    console.log('');
    console.log('Finding course pages with missing links on ' + urllimit + ' course pages:');

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

    try {

        paginationTotal = 64;
        //paginationTotal = 3;

        for (let pagination = 0; pagination < paginationTotal; pagination++) {

            console.log(domainURL);

            await page.goto(domainURL + '/courses/modules?combine=&page=' + pagination);

            //await timeout(2000);

            var moduleCode = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > div > div > div > div > div > div > a > div:nth-child(1)'), element => element.textContent));
            var moduleName = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > div > div > div > div > div > div > a > div:nth-child(2)'), element => element.textContent));
            var moduleURL = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > div > div > div > div > div > div > a'), a => a.getAttribute('href')));

            //console.log('----');
            //console.log('Module name ' + moduleName);
            //console.log('Module code ' + moduleCode);
            //console.log('----');

            moduleCodeCount = moduleCodeCount + moduleCode.length;
            moduleNameCount = moduleNameCount + moduleName.length;
            moduleURLCount = moduleURLCount + moduleURL.length;

            console.log('Module page = ' + pagination);
            console.log('- Module names = ' + moduleNameCount);
            console.log('- Module codes = ' + moduleCodeCount);
            console.log('- Module URLs = ' + moduleURLCount);
            console.log('');

            for (let index = 0; index < moduleURL.length; index++) {
                var url = domainURL + '/' + moduleURL[index];

                var code = moduleCode[index].toString();
                code = code.trim();
                //code = code.slice(0, -2);

                var name = moduleName[index].toString();
                name = name.trim();
                name = name.replace(/\,/g, "");
                //name = name.slice(0, -2);

                var minus;
                var minusCheck = url.indexOf('-');
                if (minusCheck > 0) {
                    minus = 'YES';
                    minusCount = minusCount + 1;
                }
                else {
                    minus = '';
                }

                if (listonly == 'true') {
                    url = url.replace('oneweb.soton', 'www.southampton');
                    modules.push([name, code, url]);
                } else {
                    modules.push([name, code, url, minus]);
                }
            }
        }
    }
    catch (err) {

        console.log(err);
        await page.close();
    };

    await browser.close();
}

async function runner_GenerateReport(urllimit, domainURL, domain, debug, listonly) {

    //add header to report
    if (listonly == 'true') {
        modules.push(['Module name', 'Module code', 'Module URL']);
    } else {
        modules.push(['Module name', 'Module code', 'Module URL', 'Module URL contains a minus']);
    }

    //fetch the data
    await generateReport(urllimit, domainURL, domain, debug, listonly);

    //setup today's data and time for the report
    var today = new Date();
    today = today.toDateString() + ' ' + today.toLocaleTimeString();

    //write missing modules report
    if (modules.length > 0) {
        var csv = modules.map(function (d) {
            return d.join();
        }).join('\n');
        fs.writeFileSync('../reports/csv/modules-info-list-' + domain + '.csv', csv);
    }

    //create html report
    var htmlReport = '';
    htmlReport += '<html><head></head><body>';
    htmlReport += '<h1>Digital UX - List of education modules on the website</h1>';
    htmlReport += '<h2>Report date : ' + today + '</h2>';
    htmlReport += '<hr>';
    htmlReport += '<br>';
    htmlReport += '<div>A list of all modules for Undergraduate and Postgraduate-taught courses which are live on the Southampton University website. </div>';
    htmlReport += '<br>';
    htmlReport += '<ul><li>Module total = ' + moduleURLCount + '</ul>';
    htmlReport += '<br>';
    htmlReport += htmlFunctions.generateTable(modules);
    htmlReport += '<br>';
    fs.writeFileSync('../reports/html/modules-info-list-report.html', htmlReport);

}


const argv = yargs
    .options("domain", {
        alias: "d",
        description: "Drupal domain to use (prod, pprd, dev, live",
        type: "string",
    })
    .options("urllimit", {
        alias: "u",
        description: `Set maximum number of URLs (test mode); 0 = all URLs`,
        type: "string"
    })
    .options("listonly", {
        alias: "l",
        description: "List only for southampton.ac.uk domain",
        type: "string"
    })
    .options("gebug", {
        alias: "g",
        description: "Turn on page debugger",
        type: "string"
    })
    .options("mock", {
        alias: "m",
        description: "Use mock data only",
        type: "string"
    })
    .default("u", 0)
    .default("f", '')
    .default("listonly", 'false')
    .default("gebug", 'false')
    .default("mock", 'false')
    .demandOption(["domain"], "Please specify a domain (prod, pprd, dev, live)")
    .help()
    .alias("help", "h").argv;


switch (argv.domain) {
    case 'prod':
        console.log('Testing OneWeb prod domain');
        siteURLS = URLs.getTestURLs('prod', 'education');
        domainURL = 'https://oneweb.soton.ac.uk';
        break;

    case 'pprd':
        console.log('Testing OneWeb pprd domain');
        siteURLS = URLs.getTestURLs('pprd', 'education');
        domainURL = 'https://oneweb.pprd.soton.ac.uk';
        break;

    case 'live':
        console.log('Testing external domain');
        siteURLS = URLs.getTestURLs('live', 'education');
        domainURL = 'https://www.southampton.ac.uk';
        break;

    case 'dev':
        console.log('Testing external domain');
        siteURLS = URLs.getTestURLs('dev', 'education');
        domainURL = 'https://oneweb.dev.soton.ac.uk';
        break;
}

if (argv.gebug == 'true') {
    console.log('debug true');
} else {
    console.log('debug false');
}

if (argv.jiraticket != '') {
    console.log('Adding report to Jira ticket ' + argv.jiraticket);
}

runner_GenerateReport(argv.urllimit, domainURL, argv.domain, argv.gebug, argv.listonly);

