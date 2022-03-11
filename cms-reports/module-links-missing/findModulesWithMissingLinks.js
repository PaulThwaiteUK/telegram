const fs = require('fs');
const puppeteer = require('puppeteer');
const urlGenerator = require('../local-modules/SiteURLs');
const yargs = require("yargs");
const htmlFunctions = require('../local-modules/htmlFunctions');
const { exit } = require('process');

//global variables
var missingLinksModuleCountUG = 0;
var missingLinksModuleCountPGT = 0;
var missingModuleCoursePageCountUG = 0;
var missingModuleCoursePageCountPGT = 0;
var missingModuleLinksTable = [];
var siteURLS = '';

async function generateReport(urllimit, domain, debug) {

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

    for (let i = 0; i < urllimit; i++) {
        let courseType = siteURLS[i][0];
        let courseURL = siteURLS[i][1];

        //output progress
        console.log(i + " - " + courseType + ' ' + courseURL);

        try {

            // setup the browser and go to the test url
            //browser = await puppeteer.launch();
            await page.goto(courseURL);

            //get the course name and remove commas
            var courseName = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div.hero-facts.h-auto.relative.bg-lavender.overflow-visible > div > div > div.container.mx-auto.mb-8 > div > h1'), element => element.textContent));
            courseName = courseName[0].replace(/\,/g, "");

            //create an array of module names and overview sections for each module year
            var modules404 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules > section > div > div > div > div > div > div'), element => element.textContent));
            var year1 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year1 > section > div > div > div > div > div > div'), element => element.textContent));
            var year2 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year2 > section > div > div > div > div > div > div'), element => element.textContent));
            var year3 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year3 > section > div > div > div > div > div > div'), element => element.textContent));
            var year4 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year4 > section > div > div > div > div > div > div'), element => element.textContent));
            var year5 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year5 > section > div > div > div > div > div > div'), element => element.textContent));
            var year6 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year6 > section > div > div > div > div > div > div'), element => element.textContent));

            //get URLs for each module
            //#modules-year3 > section:nth-child(3) > div:nth-child(2) > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\:pr-20.text-river > div > a

            //go through each of the year arrays to start building the report 
            //
            // A module title is less than 100 character is length
            //year1
            var modulesLinksAllYears = [];
            if (year1.length > 0) {
                var count = 0;
                for (let index = 0; index < year1.length; index++) {
                    if (count == 0) {
                        modulesLinksAllYears.push(['Year 1', year1[index].replace(/\,/g, "")]);
                        count = 1;
                    } else {
                        modulesLinksAllYears.push(['', year1[index].replace(/\,/g, "")]);
                    }
                }
            }
            if (year2.length > 0) {
                var count = 0;
                for (let index = 0; index < year2.length; index++) {
                    if (count == 0) {
                        modulesLinksAllYears.push(['Year 2', year2[index].replace(/\,/g, "")]);
                        count = 1;
                    } else {
                        modulesLinksAllYears.push(['', year2[index].replace(/\,/g, "")]);
                    }
                }
            }
            if (year3.length > 0) {
                var count = 0;
                for (let index = 0; index < year3.length; index++) {
                    if (count == 0) {
                        modulesLinksAllYears.push(['Year 3', year3[index].replace(/\,/g, "")]);
                        count = 1;
                    } else {
                        modulesLinksAllYears.push(['', year3[index].replace(/\,/g, "")]);
                    }
                }
            }
            if (year4.length > 0) {
                var count = 0;
                for (let index = 0; index < year4.length; index++) {
                    if (count == 0) {
                        modulesLinksAllYears.push(['Year 4', year4[index].replace(/\,/g, "")]);
                        count = 1;
                    } else {
                        modulesLinksAllYears.push(['', year4[index].replace(/\,/g, "")]);
                    }
                }
            }
            if (year5.length > 0) {
                var count = 0;
                for (let index = 0; index < year5.length; index++) {
                    if (count == 0) {
                        modulesLinksAllYears.push(['Year 5', year5[index].replace(/\,/g, "")]);
                        count = 1;
                    } else {
                        modulesLinksAllYears.push(['', year5[index].replace(/\,/g, "")]);
                    }
                }
            }
            if (year6.length > 0) {
                var count = 0;
                for (let index = 0; index < year6.length; index++) {
                    if (count == 0) {
                        modulesLinksAllYears.push(['Year 6', year6[index].replace(/\,/g, "")]);
                        count = 1;
                    } else {
                        modulesLinksAllYears.push(['', year6[index].replace(/\,/g, "")]);
                    }
                }
            }


            //build a table array for the report providing we have at least one module missing a link
            if (modulesLinksAllYears.length > 0) {

                var mycount = 0;
                for (let index = 0; index < modulesLinksAllYears.length; index++) {

                    var moduleYear = modulesLinksAllYears[index][0];
                    var moduleName = modulesLinksAllYears[index][1];

                    //take a tally of number of modules with missing overview sections
                    if (courseType == 'UG') {
                        missingLinksModuleCountUG++;
                    } else {
                        missingLinksModuleCountPGT++
                    }

                    //add empty cells to the table so it's easier to read
                    if (mycount == 0) {
                        missingModuleLinksTable.push([courseType, courseURL, courseName, moduleYear, moduleName]);
                        mycount = 1;
                    } else {
                        missingModuleLinksTable.push(['', '', '', moduleYear, moduleName]);
                    }
                }

                //take a tally of number of course pages with missing modules
                if (courseType == 'UG') {
                    missingModuleCoursePageCountUG++;
                } else {
                    missingModuleCoursePageCountPGT++;
                }
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
    missingModuleLinksTable.push(['Course type', 'Course URL', 'Course name', 'Module year', 'Module name with missing overview section</b>']);

    //fetch the data
    await generateReport(urllimit, domain, debug);

    //setup today's data and time for the report
    var today = new Date();
    today = today.toDateString() + ' ' + today.toLocaleTimeString();

    //create html report
    var htmlReport = '';
    htmlReport += '<html><head></head><body>';
    htmlReport += '<h1>Digital UX - Modules with missing links</h1>';
    htmlReport += '<h2>Report date : ' + today + '</h2>';
    htmlReport += '<hr>';
    htmlReport += '<div>The University undergraduate and postgraduate taught course pages display modules for the current accademic year.  There is currently no facility to display all modules for all accademic years on course pages. A consequence of this is that some modules will be listed on the course page but would not exist on the website because they are from a different accaddemic year.  A user who clicks on these modules would receive a 404 page not found error.</>';
    htmlReport += '<br><br>';
    htmlReport += '<div>The temporary solution is to display the module information on course pages and remove the link to the specific module.</div>';
    htmlReport += '<br>';
    htmlReport += '<div>The list below contains the current set of modules which would 404 on the website. </div>';
    htmlReport += '<br>';
    htmlReport += '<ul><li>There are ' + missingLinksModuleCountUG + ' modules with overview sections missing across ' + missingModuleCoursePageCountUG + ' UG course pages ';
    htmlReport += '<li>There are ' + missingLinksModuleCountPGT + ' modules with overview sections missing across ' + missingModuleCoursePageCountPGT + ' PGT course pages </ul>';
    htmlReport += '<br>';
    htmlReport += htmlFunctions.generateTable(missingModuleLinksTable);
    htmlReport += '<br>';
    fs.writeFileSync('../reports/html/modules-missing-links-report.html', htmlReport);
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
siteURLS = urlGenerator.getCoursePageURLs(argv.domain);

//run the report
runner_GenerateReport(argv.urllimit, argv.domain, argv.gebug);

