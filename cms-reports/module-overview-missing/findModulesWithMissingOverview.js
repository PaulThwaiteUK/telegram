const fs = require('fs');
const puppeteer = require('puppeteer');
const urlGenerator = require('../local-modules/SiteURLs');
const yargs = require("yargs");
const htmlFunctions = require('../local-modules/htmlFunctions');
const { exit } = require('process');

//global variables
var missingOverviewModuleCountUG = 0;
var missingOverviewModuleCountPGT = 0;
var missingModuleCoursePageCountUG = 0;
var missingModuleCoursePageCountPGT = 0;
var missingModuleOverviewTable = [];
var siteURLS = '';

async function generateReport(urllimit, domain, debug) {

    if (urllimit == 0) {
        urllimit = siteURLS.length
    }

    console.log('');
    console.log('Finding course pages with missing overview sections defined for ' + urllimit + ' course pages:');

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
            var moduleTextYear1 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year1 > section > div > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\\:pr-20.text-river'), element => element.textContent.trim()));
            var moduleTextYear2 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year2 > section > div > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\\:pr-20.text-river'), element => element.textContent.trim()));
            var moduleTextYear3 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year3 > section > div > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\\:pr-20.text-river'), element => element.textContent.trim()));
            var moduleTextYear4 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year4 > section > div > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\\:pr-20.text-river'), element => element.textContent.trim()));
            var moduleTextYear5 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year5 > section > div > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\\:pr-20.text-river'), element => element.textContent.trim()));
            var moduleTextYear6 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year6 > section > div > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\\:pr-20.text-river'), element => element.textContent.trim()));

            //get URLs for each module
            //#modules-year3 > section:nth-child(3) > div:nth-child(2) > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\:pr-20.text-river > div > a

            //go through each of the year arrays to start building the report 
            //
            // A module title is less than 100 character is length
            //year1
            var modulesOverviewAllYears = [];
            if (moduleTextYear1.length > 0) {
                var count = 0;
                for (let index = 0; index < moduleTextYear1.length; index++) {
                    if (moduleTextYear1[index].length < 100) {

                        if (count == 0) {
                            modulesOverviewAllYears.push(['Year 1', moduleTextYear1[index].replace(/\,/g, "")]);
                            count = 1;
                        } else {
                            modulesOverviewAllYears.push(['', moduleTextYear1[index].replace(/\,/g, "")]);
                        }
                    }
                }
            }

            //year2
            if (moduleTextYear2.length > 0) {
                var count = 0;
                for (let index = 0; index < moduleTextYear2.length; index++) {
                    if (moduleTextYear2[index].length < 100) {
                        if (count == 0) {
                            modulesOverviewAllYears.push(['Year 2', moduleTextYear2[index].replace(/\,/g, "")]);
                            count = 1;
                        } else {
                            modulesOverviewAllYears.push(['', moduleTextYear2[index].replace(/\,/g, "")]);
                        }
                    }
                }
            }

            //year3
            if (moduleTextYear3.length > 0) {
                var count = 0;
                for (let index = 0; index < moduleTextYear3.length; index++) {
                    if (moduleTextYear3[index].length < 100) {
                        if (count == 0) {
                            modulesOverviewAllYears.push(['Year 3', moduleTextYear3[index].replace(/\,/g, "")]);
                            count = 1;
                        } else {
                            modulesOverviewAllYears.push(['', moduleTextYear3[index].replace(/\,/g, "")]);
                        }
                    }
                }
            }

            //year4
            if (moduleTextYear4.length > 0) {
                var count = 0;
                for (let index = 0; index < moduleTextYear4.length; index++) {
                    if (moduleTextYear4[index].length < 100) {
                        if (count == 0) {
                            modulesOverviewAllYears.push(['Year 4', moduleTextYear4[index].replace(/\,/g, "")]);
                            count = 1;
                        } else {
                            modulesOverviewAllYears.push(['', moduleTextYear4[index].replace(/\,/g, "")]);
                        }
                    }
                }
            }

            //year5
            if (moduleTextYear5.length > 0) {
                var count = 0;
                for (let index = 0; index < moduleTextYear5.length; index++) {
                    if (moduleTextYear5[index].length < 100) {
                        if (count == 0) {
                            modulesOverviewAllYears.push(['Year 5', moduleTextYear5[index].replace(/\,/g, "")]);
                            count = 1;
                        } else {
                            modulesOverviewAllYears.push(['', moduleTextYear5[index].replace(/\,/g, "")]);
                        }
                    }
                }
            }

            //year6
            if (moduleTextYear6.length > 0) {
                var count = 0;
                for (let index = 0; index < moduleTextYear6.length; index++) {
                    if (moduleTextYear6[index].length < 100) {
                        if (count == 0) {
                            modulesOverviewAllYears.push(['Year 6', moduleTextYear6[index].replace(/\,/g, "")]);
                            count = 1;
                        } else {
                            modulesOverviewAllYears.push(['', moduleTextYear6[index].replace(/\,/g, "")]);
                        }
                    }
                }
            }

            //build a table array for the report providing we have at least one module missing an overview
            if (modulesOverviewAllYears.length > 0) {

                var mycount = 0;
                for (let index = 0; index < modulesOverviewAllYears.length; index++) {

                    var moduleYear = modulesOverviewAllYears[index][0];
                    var moduleName = modulesOverviewAllYears[index][1];

                    //take a tally of number of modules with missing overview sections
                    if (courseType == 'UG') {
                        missingOverviewModuleCountUG++;
                    } else {
                        missingOverviewModuleCountPGT++
                    }

                    //add empty cells to the table so it's easier to read
                    if (mycount == 0) {
                        missingModuleOverviewTable.push([courseType, courseURL, courseName, moduleYear, moduleName]);
                        mycount = 1;
                    } else {
                        missingModuleOverviewTable.push(['', '', '', moduleYear, moduleName]);
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
    missingModuleOverviewTable.push(['Course type', 'Course URL', 'Course name', 'Module year', 'Module name with missing overview section']);

    //fetch the data
    await generateReport(urllimit, domain, debug);

    //setup today's data and time for the report
    var today = new Date();
    today = today.toDateString() + ' ' + today.toLocaleTimeString();

    //create html report
    var htmlModuleMissingOverviewReport = '';
    htmlModuleMissingOverviewReport += '<html><head></head><body>';
    htmlModuleMissingOverviewReport += '<h1>Digital UX - Modules with a missing overview section</h1>';
    htmlModuleMissingOverviewReport += '<h2>Report date : ' + today + '</h2>';
    htmlModuleMissingOverviewReport += '<hr>';
    htmlModuleMissingOverviewReport += '<div>The modules section on a course page displays the module name and an overview of what that module is about.  Some modules on course pages are missing the overview section.  The overview section for a module needs to be added in Worktribe for it to be displayed on the website. </>';
    htmlModuleMissingOverviewReport += '<br><br>';
    htmlModuleMissingOverviewReport += '<div>Update the \'overview\' section of the module in Worktribe.  The update will then appear on the website.</>';
    htmlModuleMissingOverviewReport += '<br><br>';
    htmlModuleMissingOverviewReport += '<div>The list below contains the current set of modules with a missing overview section. </div>';
    //htmlModuleMissingOverviewReport += '<br>';
    htmlModuleMissingOverviewReport += '<ul><li>There are ' + missingOverviewModuleCountUG + ' modules with overview sections missing across ' + missingModuleCoursePageCountUG + ' UG course pages ';
    htmlModuleMissingOverviewReport += '<li>There are ' + missingOverviewModuleCountPGT + ' modules with overview sections missing across ' + missingModuleCoursePageCountPGT + ' PGT course pages </ul>';
    htmlModuleMissingOverviewReport += '<br>';
    htmlModuleMissingOverviewReport += htmlFunctions.generateTable(missingModuleOverviewTable);
    htmlModuleMissingOverviewReport += '<br>';
    fs.writeFileSync('../reports/html/modules-missing-overview-report.html', htmlModuleMissingOverviewReport);
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

