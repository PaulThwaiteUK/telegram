const puppeteer = require('puppeteer');
const fsExtra = require('fs-extra')
const fs = require('fs');
const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG;
const URLs = require('./SiteURLs');
const yargs = require("yargs");
const { countReset, count } = require('console');
const { updateJIRATicket, attachJiraTicket, getIssueAttachmentIDs, deleteAttachmentIDs, addIssueAttachmentCurl } = require('./jiraFunctions');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
const { getSystemErrorMap } = require('util');
const { number } = require('yargs');


var imageGenerationError = 0;
let referenceImagesFolder;
let testImagesFolder;
let diffImagesFolder;
let siteURLS = '';
let pagesTextFound = [];
let pagesTextNotFound = [];
var errorFound = 0;
let domain;
var report = [];
var missingModules = [];
var missingERQS = [];
var missingCCDs = [];
var missingKISWidgetInvalid = [];
var missingKISWidgetNotSet = [];
var courseStartYearRange = [];
var moduleYearRange = [];
var feesUKRange = [];
var feesEURange = [];
var moduleInfo = [];
var moduleMissingOverviewInfo = [];
var reportsDir = 'reports';
var dual = true;
var missingCDD404 = [];
var salariedUKTrainee = [];
var trainingUKTrainee = [];


let missingModuleText = 'have module information';
let missingERQSText = 'have the entry requirements for this course yet';

async function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function generateTable(data) {

    //if (data == null)
    //{
    //    return;
    //}

    var html = '<table border="1" cellpadding="3" cellspacing="5" style="border-collapse:collapse;">';

    if (typeof (data[0]) === 'undefined') {
        return null;
    }

    if (data[0].constructor === String) {
        html += '<tr>\r\n';
        for (var item in data) {
            if (data[item].indexOf('http') != -1) {
                var theURL = data[item];
                urllink = '<a href="' + theURL + '"> ' + theURL + '</a';
                data[item] = urllink;
            }
            html += '<td>' + data[item] + '</td>\r\n';
        }
        html += '</tr>\r\n';
    }

    if (data[0].constructor === Array) {
        for (var row in data) {
            html += '<tr>\r\n';
            for (var item in data[row]) {
                data[row][item] = data[row][item].toString();
                if (data[row][item].indexOf('http') != -1) {
                    var theURL = data[row][item];
                    urllink = '<a href="' + theURL + '"> ' + theURL + '</a';
                    data[row][item] = urllink;
                }
                html += '<td>' + data[row][item] + '</td>\r\n';
            }
            html += '</tr>\r\n';
        }
    }

    if (data[0].constructor === Object) {
        for (var row in data) {
            html += '<tr>\r\n';
            for (var item in data[row]) {
                if (data[row][item].indexOf('http') != -1) {
                    var theURL = data[item];
                    urllink = '<a href="' + theURL + '"> ' + theURL + '</a';
                    data[row][item] = urllink;
                }
                html += '<td>' + item + ':' + data[row][item] + '</td>\r\n';
            }
            html += '</tr>\r\n';
        }
    }

    html += '</table>';
    return html;
}

async function findTextOnPage(textToFind, urllimit) {

    if (urllimit == 0) {
        urllimit = siteURLS.length
    }

    console.log('');
    console.log('Searching ' + urllimit + ' pages for : ' + textToFind);

    var found;
    var results;

    console.log('Finding - ' + textToFind);

    for (let i = 0; i < urllimit; i++) {
        let URLtype = siteURLS[i][0];
        let testURL = siteURLS[i][1];

        //output progress
        console.log(i + " - " + URLtype + ' ' + testURL);

        var browser = '';

        try {
            browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setViewport({ width: 1300, height: 5000 });
            await page.goto(testURL);
            await timeout(2000);

            // PGT and UG have different tabs
            if (URLtype == 'UG') {
                var pageSelectors = ['#about', '#entry', '#structure', '#learning', '#careers', '#fees', '#apply'];
            } else {
                var pageSelectors = ['#about', '#entry', '#structure', '#learning', '#careers', '#funding', '#apply'];
            }

            found = false;
            results = '';

            // loop through each tab finding the search text
            for (let index = 0; index < pageSelectors.length; index++) {

                const itemSelector = pageSelectors[index];

                var data = await page.evaluate((selector) => {
                    return document.querySelector(selector).textContent;
                }, itemSelector);

                data = data.toLowerCase();
                data = data.replace(/\s/g, "");

                var occurrences = 0;
                occurrences = data.match(new RegExp(textToFind, "g")) || [].length;

                if (occurrences.length > 0) {
                    results = results + itemSelector + '(' + occurrences.length + ') ';
                    found = true;
                }
            }

            await browser.close();

        } catch (err) {
            console.log(err);
            await browser.close();
        }

        if (found) {
            pagesTextFound.push([testURL + ' ', results]);
        }
        else {
            pagesTextNotFound.push([testURL]);
        }
    }
}

async function scrapePageFees(textToFind, postfix) {

    console.log('');
    console.log('Searching ' + siteURLS.length + ' pages');

    var found;

    for (let i = 0; i < siteURLS.length; i++) {
        let testName = siteURLS[i][0];
        let testURL = siteURLS[i][1] + postfix;

        console.log(testURL);

        try {
            const browser = await puppeteer.launch({ headless: false });
            const page = await browser.newPage();
            await page.setViewport({ width: 1300, height: 5000 });
            await page.goto(testURL);
            await timeout(2000);

            let itemSelector = "#fees";

            var data = await page.evaluate((selector) => {
                return document.querySelector(selector).textContent;
            }, itemSelector);

            //remove all whitespace  
            var data = data.replace(/\s/g, "");

            //extract the fees data
            var feesUK = data.split('Kstudentspay').pop().split('.EUan')[0];
            var feesEU = data.split('internationalstudentspay').pop().split('.Whatyourfeespa')[0];

            console.log('UK = ' + feesUK + ' EU = ' + feesEU);




            await browser.close();
        } catch (err) {

            // an error can cause a promise to hang or unpredicatable results (needs investigation)
            // so best to kill the process           
            console.log(err);
            process.exit(1);
        };

        if (found) {
            pagesTextFound.push(testURL);
            console.log(i + ' FOUND ' + testURL);
        }
        else {
            pagesTextNotFound.push(testURL);
            console.log(i + ' ' + testURL);
        }

    }

}


async function generateReport(urllimit, domain, debug) {

    var erqsMissing;
    var erqsYearOne;
    var erqsYearTwo;
    var modulesMissing;
    var feesEU;
    var feesUK;
    var modulesYear;
    var progSpec;
    var progSpecAddendum;
    var textToFind;
    var modules404;
    var kisWidget;
    var courseName;
    var year1;
    var year2;
    var year3;
    var year4;
    var year5;
    var year6;
    var countUG = 0;
    var countPGT = 0;
    var missingOverviewCountUG = 0;
    var missingOverviewCountPGT = 0;
    var module404UGCourseCount = 0;
    var module404PGTCourseCount = 0;
    var moduleMissingOverviewCourseCountUG = 0;
    var moduleMissingOverviewCourseCountPGT = 0;
    var CDDurl;
    var CDD404;

    if (urllimit == 0) {
        urllimit = siteURLS.length
    }

    console.log('');
    console.log('Generating education report for ' + urllimit + ' course pages');


    for (let i = 0; i < urllimit; i++) {
        let URLtype = siteURLS[i][0];
        let testURL = siteURLS[i][1];

        //output progress
        console.log(i + " - " + URLtype + ' ' + testURL);

        var browser = '';
        year1 = [];
        year2 = [];
        year3 = [];
        year4 = [];
        year5 = [];
        year6 = [];
        overviewyear1 = [];

        try {

            // setup the browser and go to the test url
            browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setViewport({ width: 1300, height: 5000 });
            await page.goto(testURL);

            var prodPage;
            if (domain == 'pprdd') {
                //setup a second page for prod
                prodPage = await browser.newPage();
                await prodPage.setViewport({ width: 1300, height: 5000 });

                var splitURL = testURL.split(".");
                var prodTestURL = splitURL[0] + '.' + splitURL[2] + '.' + splitURL[3] + '.' + splitURL[4];
                //console.log('prod test url = ' + prodTestURL);
                await prodPage.goto(prodTestURL);
            }

            //
            //check for missing page 
            //
            //a missing course URL redirects to the prod hompeage with the below message
            textToFind = 'You are not authorized to access this page.';
            pageMissingProd = await page.evaluate((textToFind) => window.find(textToFind), textToFind);

            //check for 404 on live
            //a missing course URL redirects to the course finder page
            textToFind = 'course finder';
            pageMissingLive = await page.evaluate((textToFind) => window.find(textToFind), textToFind);

            if (pageMissingLive || pageMissingProd) {
                console.log('URL not found');
                await browser.close();
                continue;
            }


            //
            // get programme code from the programme spec 
            // there are sometimes two URLs and we only need one
            //
            var pageHrefs = await page.$$eval('a', links => links.map(a => a.href));
            var progCode = '';
            var prodProgCode = '';
            var found = false;
            for (let i = 0; i < pageHrefs.length; i++) {

                if ((pageHrefs[i].indexOf('/programmespecs/') >= 0) && (!found)) {

                    CDDurl = pageHrefs[i];

                    var splitURL = pageHrefs[i].split("-");

                    splitURL.forEach(part => {
                        if (!isNaN(part)) {
                            progCode = progCode + '-' + part;
                        }
                    });

                    found = true;

                    if (domain == 'pprdff') {
                        //get the programme code for prod to compare
                        var prodPageHrefs = await prodPage.$$eval('a', links => links.map(a => a.href));
                        prodProgCode = await getProgrammeCode(prodPageHrefs);
                    }

                };
            }

            // remove trailing
            if (progCode.length == 0) {
                progCode = 'Not found';
            } else {
                progCode = progCode.substring(1);
            }

            if (prodProgCode.length == 0) {
                prodProgCode = 'N/A';
            } else {
                prodProgCode = prodProgCode.substring(1);
            }

            // make it spreadsheet friendly (e.g. text and not a number)
            // progCode = '"' + progCode + '"';
            //prodProgCode = '"' + prodProgCode + '"';

            //
            // get the whole page text and put it into a string
            // we will chop it up later to create the report
            //
            let itemSelector = "#main-content";
            var pageText = await page.evaluate((selector) => {
                return document.querySelector(selector).textContent;
            }, itemSelector);

            //console.log(pageText);

            //remove all whitespace so it's easier to search
            var pageText = pageText.replace(/\s/g, "");

            if (debug == 'true') {
                console.log('----------');
                console.log('data = ' + pageText);
                console.log('----------');
            }

            //
            // KIS widget
            //
            if (URLtype == 'UG') {
                itemSelector = "#kis-widget_1";

                //if selector is missing it means the Discover Uni ID has not been set in the CMS
                //and the KIS widget is therefore not rendered
                try {
                    var pageTextKIS = await page.evaluate((selector) => {
                        return document.querySelector(selector).textContent;
                    }, itemSelector);

                    //the Discover Uni ID is set incorrectly in the CMS
                    kisWidget = pageTextKIS.indexOf("undefined at undefined");
                    if (kisWidget != -1) {
                        kisWidget = "Invalid Discover Uni ID in CMS";
                        missingKISWidgetInvalid.push([URLtype, testURL]);
                    }
                    //the KIS widget displays the correct course info
                    else {
                        kisWidget = "Yes";
                    }

                    if (debug == 'true') {
                        console.log('Kis ' + pageText);
                    }
                } catch {
                    //the selector does not exist on the page
                    kisWidget = "Missing Discover Uni ID in CMS";
                    missingKISWidgetNotSet.push([URLtype, testURL]);
                }
            }
            else {
                //KIS widget is not valid for PGT courses
                kisWidget = "N/A";
            }

            //
            // course start date
            //
            data = pageText.substring(0, 600);
            courseYear = data.split(')starting').pop().split('for')[0];

            console.log(courseYear);

            //verify data
            if (courseYear.length > 19) {
                courseYear = 'Not found';
            }

            courseStartYearRange.push([URLtype, testURL, courseYear]);




            //
            //CDDs
            //
            progSpec = pageText.split('ODTDownload').pop().split('Course')[0];

            //verify data
            if (progSpec.length > 8) {
                progSpec = 'Not found';
                missingCCDs.push([URLtype, testURL]);
            }

            //
            //CDDs 404
            //
            //#about > section:nth-child(4) > div:nth-child(4) > a
            var CDDpage;
            try {
                CDDpage = await browser.newPage();
                await CDDpage.setViewport({ width: 1300, height: 5000 });
                await CDDpage.goto(CDDurl);

                textToFind = '404';
                var CDDpage404 = await page.evaluate((textToFind) => window.find(textToFind), textToFind);

                //console.log('cdd ' + CDDpage404);

                if (CDDpage404 == false) {
                    CDD404 = '404';
                    missingCDD404.push([URLtype, testURL, CDDurl]);
                    console.log(missingCDD404.length);

                }
            } catch (error) {

            }

            CDDpage.close();


            //
            // ERQs
            //
            erqsMissing = pageText.indexOf('havetheentryrequirementsforthiscourseyet');
            if (erqsMissing != -1) {
                erqsMissing = 'Missing!';

                missingERQS.push([testURL + ' ', 'year 1']);

            } else {
                erqsMissing = 'Yes';
            }


            //
            // dual ERQs
            //
            if (dual) {

                erqsMissing = pageText.indexOf('havetheentryrequirementsforthiscourseyet');

                if (URLtype == 'UG') {

                    console.log('*');

                    if (erqsMissing === -1) {
                        erqsYearOne = pageText.indexOf('ForAcademicyear202223A-levels');
                        erqsYearTwo = pageText.indexOf('ForAcademicyear202324A-levels');
                        erqsMissing = 'Yes'; //for PGT curses in a UG dual year 

                        if (erqsYearOne == -1) {

                            //double check the erqs don't need A-levels
                            erqsYearOne = pageText.indexOf('ForAcademicyear202223Eligibility');

                            if (erqsYearOne == -1) {

                                erqsYearOne = 'Missing!';
                                missingERQS.push([URLtype, testURL + ' ', 'year 1']);
                            }
                        }
                        else {
                            erqsYearOne = 'Yes';
                        }

                        if (erqsYearTwo == -1) {

                            //double check the erqs don't need A-levels
                            erqsYearTwo = pageText.indexOf('ForAcademicyear202324Eligibility');

                            if (erqsYearTwo == -1) {

                                erqsYearTwo = 'Missing!';
                                missingERQS.push([URLtype, testURL + ' ', 'year 2']);
                            }
                        }
                        else {
                            erqsYearTwo = 'Yes';
                        }
                    }
                    else {
                        erqsYearOne = 'Missing!';
                        erqsYearTwo = 'Missing!';
                        erqsMissing = "Missing!";
                    }
                } else {
                    erqsMissing = pageText.indexOf('havetheentryrequirementsforthiscourseyet');
                    if (erqsMissing != -1) {
                        erqsMissing = 'Missing!';
                        missingERQS.push([URLtype, testURL, 'year 1']);

                    } else {
                        erqsMissing = 'Yes';
                    }
                }

            }
            else {
                erqsMissing = pageText.indexOf('havetheentryrequirementsforthiscourseyet');
                if (erqsMissing != -1) {
                    erqsMissing = 'Missing!';
                    missingERQS.push([URLtype, testURL]);

                } else {
                    erqsMissing = 'Yes';
                }
            }

            //
            // modules 
            //
            modulesMissing = pageText.indexOf('havemoduleinformation');

            if (modulesMissing != -1) {
                modulesMissing = 'Missing!';
                missingModules.push([URLtype, testURL]);
            } else {
                modulesMissing = 'Yes';
            }

            //
            // modules date 
            //
            modulesYear = pageText.split('ForentryinAcademicYear').pop().split('Year')[0];

            //verify data
            if (modulesYear.length > 8) {
                modulesYear = 'Not found';
            }

            moduleYearRange.push([URLtype, testURL, modulesYear]);


            //
            // fees 
            //
            feesUK = pageText.split('UKstudentspay').pop().split('.')[0];
            feesEU = pageText.split('internationalstudentspay').pop().split('.')[0];
            salariedUKTrainee = pageText.split('SalariedUKtraineespay').pop().split('T')[0];
            trainingUKTrainee = pageText.split('TrainingUKtraineespay').pop().split('T')[0];

            feesUK = feesUK.slice(1);
            feesEU = feesEU.slice(1);
            salariedUKTrainee = salariedUKTrainee.slice(1);
            trainingUKTrainee = trainingUKTrainee.slice(1);

            feesUK = '"' + feesUK + '"';
            feesEU = '"' + feesEU + '"';
            salariedUKTrainee = '"' + salariedUKTrainee + '"';
            trainingUKTrainee = '"' + trainingUKTrainee + '"';

            //verify data
            if (feesUK.length > 15) {
                feesUK = ' ';
            }

            if (salariedUKTrainee.length > 15) {
                salariedUKTrainee = ' ';
            }

            if (trainingUKTrainee.length > 15) {
                trainingUKTrainee = ' ';
            }

            if (feesEU.length > 15) {
                feesEU = 'Not found';

                if (pageText.indexOf('Thiscourseisnotavailableto') != -1) {
                    feesEU = 'N/A';
                }

                if (pageText.indexOf('internationaltraineespay') != -1) {
                    feesEU = pageText.split('internationaltraineespay').pop().split('W')[0];
                    feesEU = '"' + feesEU + '"';

                    if (feesEU.length > 15) {
                        feesEU = 'Not found';
                    }
                }
            }

            feesUKRange.push([URLtype, testURL, feesUK]);
            feesEURange.push([URLtype, testURL, feesEU]);


            //
            // look for modules which have no hyperlink
            // this is for a 404 module report to supply stakeholders with list of modules they need to fix 
            //
            courseName = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > div > h1'), element => element.textContent));


            courseName = courseName[0].replace(/\,/g, "");

            modules404 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules > section > div > div > div > div > div > div'), element => element.textContent));

            //overviewyear1 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year3 > section:nth-child(3) > div:nth-child(2) > div > div > div > div > p'), element => element.textContent));

            // overviewyear1 = await page.$eval('#modules-year3', (uiElement) => {return uiElement.children});



            //#modules-year3 > section:nth-child(3)
            //#modules-year3 > section > div > div > div > div > div > p
            //#modules-year3 > section:nth-child(3) > div:nth-child(19) > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\:pr-20.text-river > div > a > div
            //#modules-year3 > section:nth-child(3) > div:nth-child(2) > div > div > div > div > p

            year1 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year1 > section > div > div > div > div > div > div'), element => element.textContent));
            year2 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year2 > section > div > div > div > div > div > div'), element => element.textContent));
            year3 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year3 > section > div > div > div > div > div > div'), element => element.textContent));
            year4 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year4 > section > div > div > div > div > div > div'), element => element.textContent));
            year5 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year5 > section > div > div > div > div > div > div'), element => element.textContent));
            year6 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year6 > section > div > div > div > div > div > div'), element => element.textContent));

            //console.log(year3[0]);
            //console.log(year3[0][0]);


            //
            //#modules-year1 > section:nth-child(2) > div:nth-child(2) > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\:pr-20.text-river > div > a > div

            // overview
            //#modules-year1 > section > div > div > div > div> div > p

            // module name
            //#modules-year3 > section > div > div > div > div. > div > a > div

            //const notifs = await page.evaluate(() => {
            //    return (Array.from(document.querySelector('#modules-year3 > section > div > div > div > div > div > div').children).length)});
            //
            //console.log('children = '  + notifs);

            //#modules-year3 > section:nth-child(3) > div:nth-child(11) > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\:pr-20.text-river > div > a > div



            //year 3 
            //#modules-year3
            //#modules-year3 > h4
            //#modules-year3 > section:nth-child(2)

            //#modules-year3 > section:nth-child(3) > div:nth-child(9) > div > div > div > div > a > div
            //#modules-year3 > section:nth-child(3) > div:nth-child(9) > div > div > div > div > p
            //#modules-year3 > section:nth-child(3) > div:nth-child(11) > div > div > div > div > a > div
            //#modules-year3 > section:nth-child(3)



            //const textsArray = await page.evaluate(() => [...document.querySelectorAll('#modules-year3 ')].map(elem => elem.textContent.trim()));
            /*
                        var test = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year3 > section > div > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\\:pr-20.text-river'), element => element.textContent));
                        var hope = test.toString().split('\n');
                        console.log(hope.length);
                        console.log(hope);
                        var pls = [];
                        for (let i = 0; i < hope.length; i += 1) {
                            if (hope[i].trim() != '')
                            {
                                //get rid of headers - you must
                                if (hope[i].trim().indexOf('You must') == -1) {
            
                                    var moduleName = hope[i].trim();
                                    var overview = hope[i+1].trim();
            
                                    if ((moduleName.length < 150) && (overview.length < 10))
                                    {
                                        //console.log(hope[i].trim());
                                    }
                                }
                            }
                        }
            
                        //console.log(test);
                        
                        /*
                        let names = page.querySelectorAll(
                            "#modules-year3"
                        );
                        let arr = Array.prototype.slice.call(names);
                        console.log('len = ' + arr.length);
                        let text_arr = [];
                        for (let i = 0; i < arr.length; i += 1) {
                            text_arr.push(arr[i].innerHTML);
                        }
                        console.log(text_arr.length);
                        console.log(text_arr);
                        */





            var modulenames = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year3 > section > div > div > div > div > div > a > div'), element => element.textContent.trim()));
            var overviews = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year3 > section > div > div > div > div > div > p '), element => element.textContent.trim()));



            //var test = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year3 > section > div > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\\:pr-20.text-river'), element => element.textContent.trim()));
            //var test = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year3 > section > div > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\\:pr-20.text-river'), element => element.textContent.trim()));
            var moduleTextYear1 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year1 > section > div > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\\:pr-20.text-river'), element => element.textContent.trim()));
            var moduleTextYear2 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year2 > section > div > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\\:pr-20.text-river'), element => element.textContent.trim()));
            var moduleTextYear3 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year3 > section > div > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\\:pr-20.text-river'), element => element.textContent.trim()));
            var moduleTextYear4 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year4 > section > div > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\\:pr-20.text-river'), element => element.textContent.trim()));
            var moduleTextYear5 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year5 > section > div > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\\:pr-20.text-river'), element => element.textContent.trim()));
            var moduleTextYear6 = await page.evaluate(() => Array.from(document.querySelectorAll('#modules-year6 > section > div > div > div > div.relative.flex-grow.px-4.pr-12.py-4.lg\\:pr-20.text-river'), element => element.textContent.trim()));


            //year1
            var modulesOverviewYearsArray = [];
            if (moduleTextYear1.length > 0) {
                var count = 0;
                for (let index = 0; index < moduleTextYear1.length; index++) {
                    if (moduleTextYear1[index].length < 100) {

                        if (count == 0) {
                            modulesOverviewYearsArray.push(['Year 1', moduleTextYear1[index].replace(/\,/g, "")]);
                            count = 1;
                        } else {
                            modulesOverviewYearsArray.push(['', moduleTextYear1[index].replace(/\,/g, "")]);
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
                            modulesOverviewYearsArray.push(['Year 2', moduleTextYear2[index].replace(/\,/g, "")]);
                            count = 1;
                        } else {
                            modulesOverviewYearsArray.push(['', moduleTextYear2[index].replace(/\,/g, "")]);
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
                            modulesOverviewYearsArray.push(['Year 3', moduleTextYear3[index].replace(/\,/g, "")]);
                            count = 1;
                        } else {
                            modulesOverviewYearsArray.push(['', moduleTextYear3[index].replace(/\,/g, "")]);
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
                            modulesOverviewYearsArray.push(['Year 4', moduleTextYear4[index].replace(/\,/g, "")]);
                            count = 1;
                        } else {
                            modulesOverviewYearsArray.push(['', moduleTextYear4[index].replace(/\,/g, "")]);
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
                            modulesOverviewYearsArray.push(['Year 5', moduleTextYear5[index].replace(/\,/g, "")]);
                            count = 1;
                        } else {
                            modulesOverviewYearsArray.push(['', moduleTextYear5[index].replace(/\,/g, "")]);
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
                            modulesOverviewYearsArray.push(['Year 6', moduleTextYear6[index].replace(/\,/g, "")]);
                            count = 1;
                        } else {
                            modulesOverviewYearsArray.push(['', moduleTextYear6[index].replace(/\,/g, "")]);
                        }
                    }
                }
            }

            if (modulesOverviewYearsArray.length > 0) {

                var mycount = 0;
                for (let index = 0; index < modulesOverviewYearsArray.length; index++) {

                    var moduleYear = modulesOverviewYearsArray[index][0];
                    var moduleName = modulesOverviewYearsArray[index][1];

                    if (URLtype == 'UG') {
                        missingOverviewCountUG = missingOverviewCountUG + 1;
                    } else {
                        missingOverviewCountPGT = missingOverviewCountPGT + 1;
                    }

                    if (mycount == 0) {
                        moduleMissingOverviewInfo.push([URLtype, testURL, courseName, moduleYear, moduleName]);
                        mycount = 1;
                    } else {
                        moduleMissingOverviewInfo.push(['', '', '', moduleYear, moduleName]);
                    }
                }


                moduleMissingOverviewInfo.push(['', '', '', '']);

                if (URLtype == 'UG') {
                    moduleMissingOverviewCourseCountUG = moduleMissingOverviewCourseCountUG + 1;
                } else {
                    moduleMissingOverviewCourseCountPGT = moduleMissingOverviewCourseCountPGT + 1;
                }
            }


            //var hope = modulesOverviewYearsArray.length;
            //console.log(hope);
            //console.log(modulesOverviewYearsArray);



            if (debug == 'true') {
                console.log('--- debug ---');
                console.log('Course name = ' + courseName);
                console.log('Modules 404 = ' + modules404);
                console.log('Year 1 = ' + year1);
                console.log('Year 2 = ' + year2);
                console.log('Year 3 = ' + year3);

                console.log('Year 4 = ' + year4);
                console.log('Year 5 = ' + year5);
                console.log('Year 6 = ' + year6);
                //console.log('Size = ' + size);
                console.log('--- debug ---');
            }


            //PGT is typically ome year
            if ((year1.length == 0) && (year2.length == 0) && (year3.length == 0) && (year4.length == 0) && (year5.length == 0) && (modules404.length > 0)) {
                year1 = modules404;
            }


            await browser.close();

        } catch (err) {

            console.log(err);
            await browser.close();
        };

        if (debug == 'true') {
            console.log('course year =' + courseYear);
            console.log('CDDc =' + progSpec);
            console.log('prog spec addendum =' + progSpecAddendum);
            console.log('erq missing =' + erqsMissing);
            console.log('modules missing =' + modulesMissing);
            console.log('fees UK =' + feesUK);
            console.log('fees EU =' + feesEU);
            console.log('modules year =' + modulesYear);
        }

        //
        //add data to a report array
        //
        if (dual) {
            if (URLtype == 'UG') {
                report.push([URLtype, testURL, progCode, erqsYearOne, erqsYearTwo, modulesMissing, kisWidget, courseYear, progSpec, modulesYear, feesUK, feesEU, salariedUKTrainee, trainingUKTrainee]);
            }
            else {
                report.push([URLtype, testURL, progCode, erqsMissing, 'N/A', modulesMissing, kisWidget, courseYear, progSpec, modulesYear, feesUK, feesEU, salariedUKTrainee, trainingUKTrainee]);
            }
        }
        else {
            report.push([URLtype, testURL, progCode, erqsMissing, 'N/A', modulesMissing, kisWidget, courseYear, progSpec, modulesYear, feesUK, feesEU, salariedUKTrainee, trainingUKTrainee]);
        }

        //
        // add data to year arrays
        //
        yearsArray = [];
        if (year1.length > 0) {
            var count = 0;
            for (let index = 0; index < year1.length; index++) {
                if (count == 0) {
                    yearsArray.push(['Year 1', year1[index].replace(/\,/g, "")]);
                    count = 1;
                } else {
                    yearsArray.push(['', year1[index].replace(/\,/g, "")]);
                }
            }
        }
        if (year2.length > 0) {
            var count = 0;
            for (let index = 0; index < year2.length; index++) {
                if (count == 0) {
                    yearsArray.push(['Year 2', year2[index].replace(/\,/g, "")]);
                    count = 1;
                } else {
                    yearsArray.push(['', year2[index].replace(/\,/g, "")]);
                }
            }
        }
        if (year3.length > 0) {
            var count = 0;
            for (let index = 0; index < year3.length; index++) {
                if (count == 0) {
                    yearsArray.push(['Year 3', year3[index].replace(/\,/g, "")]);
                    count = 1;
                } else {
                    yearsArray.push(['', year3[index].replace(/\,/g, "")]);
                }
            }
        }
        if (year4.length > 0) {
            var count = 0;
            for (let index = 0; index < year4.length; index++) {
                if (count == 0) {
                    yearsArray.push(['Year 4', year4[index].replace(/\,/g, "")]);
                    count = 1;
                } else {
                    yearsArray.push(['', year4[index].replace(/\,/g, "")]);
                }
            }
        }
        if (year5.length > 0) {
            var count = 0;
            for (let index = 0; index < year5.length; index++) {
                if (count == 0) {
                    yearsArray.push(['Year 5', year5[index].replace(/\,/g, "")]);
                    count = 1;
                } else {
                    yearsArray.push(['', year5[index].replace(/\,/g, "")]);
                }
            }
        }
        if (year6.length > 0) {
            var count = 0;
            for (let index = 0; index < year6.length; index++) {
                if (count == 0) {
                    yearsArray.push(['Year 6', year6[index].replace(/\,/g, "")]);
                    count = 1;
                } else {
                    yearsArray.push(['', year6[index].replace(/\,/g, "")]);
                }
            }
        }

        if (yearsArray.length > 0) {

            var mycount = 0;
            for (let index = 0; index < yearsArray.length; index++) {
                var moduleYear = yearsArray[index][0];
                var moduleName = yearsArray[index][1];

                if (URLtype == 'UG') {
                    countUG = countUG + 1;
                } else {
                    countPGT = countPGT + 1;
                }

                if (mycount == 0) {
                    moduleInfo.push([URLtype, testURL, courseName, moduleYear, moduleName]);
                    mycount = 1;
                } else {
                    moduleInfo.push(['', '', '', moduleYear, moduleName]);
                }
            }

            moduleInfo.push(['', '', '', '']);

            if (URLtype == 'UG') {
                module404UGCourseCount = module404UGCourseCount + 1;
            } else {
                module404PGTCourseCount = module404PGTCourseCount + 1;
            }
        }
    }

    //
    // add stats to the bottom of the report
    //
    moduleInfo.push(['', '', '', '']);
    moduleInfo.push(['Stats', '', '', '']);
    moduleInfo.push(['UG', '', '', '']);
    moduleInfo.push(['Courses with missing modules = ' + module404UGCourseCount, '', '', '']);
    moduleInfo.push(['Total missing modules  = ' + countUG, '', '', '']);
    moduleInfo.push(['', '', '', '']);
    moduleInfo.push(['PGT', '', '', '']);
    moduleInfo.push(['Courses with missing modules = ' + module404PGTCourseCount, '', '', '']);
    moduleInfo.push(['Total missing modules  = ' + countPGT, '', '', '']);

    moduleMissingOverviewInfo.push(['', '', '', '']);
    moduleMissingOverviewInfo.push(['Stats', '', '', '']);
    moduleMissingOverviewInfo.push(['UG', '', '', '']);
    moduleMissingOverviewInfo.push(['Courses with missing modules = ' + moduleMissingOverviewCourseCountUG, '', '', '']);
    moduleMissingOverviewInfo.push(['Total missing modules  = ' + missingOverviewCountUG, '', '', '']);
    moduleMissingOverviewInfo.push(['', '', '', '']);
    moduleMissingOverviewInfo.push(['PGT', '', '', '']);
    moduleMissingOverviewInfo.push(['Courses with missing modules = ' + moduleMissingOverviewCourseCountPGT, '', '', '']);
    moduleMissingOverviewInfo.push(['Total missing modules  = ' + missingOverviewCountPGT, '', '', '']);
}


async function getProgrammeCode(pageHrefs) {

    var found = false;
    var progCode = '';
    for (let i = 0; i < pageHrefs.length; i++) {

        if ((pageHrefs[i].indexOf('/programmespecs/') >= 0) && (!found)) {

            var splitURL = pageHrefs[i].split("-");

            splitURL.forEach(part => {
                if (!isNaN(part)) {
                    progCode = progCode + '-' + part;
                }
            });

            found = true;
        };
    }
    return progCode
}


async function runner_FindText(text, urllimit, jiraTicket, domain) {

    //setup the report
    pagesTextFound.push(['Searching for text : ' + text]);
    pagesTextFound.push(['Server = ' + domain]);
    pagesTextFound.push(['']);
    pagesTextFound.push(['URL', 'Page section(occurrences)']);

    await findTextOnPage(text, urllimit);

    if (pagesTextFound.length > 4) {

        var foundURLs = pagesTextFound.length - 4;
        pagesTextFound.push(['']);
        pagesTextFound.push(['Found ' + foundURLs + ' URLs']);

        //write report to file - CSV
        var csv = pagesTextFound.map(function (d) {
            return d.join();
        }).join('\n');
        fs.writeFileSync(reportsDir + '/findTextOnPage_report_' + domain + '.csv', csv);

        console.log('');
        console.log('');
        console.log('-----------------------------------------------------------------------------');
        console.log(csv);
        console.log('-----------------------------------------------------------------------------');

        // upload reports to jira
        if (jiraTicket != undefined) {
            console.log('');
            console.log('');
            console.log('Attaching report to Jira ticket number ' + jiraTicket);

            // delete attachments
            //await deleteAttachmentIDs(jiraTicket);

            // attach reports to jira ticket
            filename = 'findTextOnPage_report_' + domain + '.csv';
            await addIssueAttachmentCurl(reportsDir + '/findTextOnPage_report_' + domain + '.csv', jiraTicket);

            // add a comment to the jira ticket
            updateJIRATicket(jiraTicket, 'Search for text \'' + text + '\' and ' + foundURLs + ' URLs matched.  The search was performed on ' + domain + '.\\n\\nSee attachement : ' + filename);
        }
    }
    else {
        console.log('Text not found');
    }
}

async function runner_ScrapeFees(text, postfix) {

    //await findTextOnPage(text, postfix);
    await scrapePageFees(text, postfix);

    if (pagesTextFound.length > 0) {
        console.log(pagesTextFound.length + ' pages found with text \'' + text + '\'');
        console.log()
        console.log(pagesTextFound);
    }
    else {
        console.log();
        console.log(pagesTextNotFound.length + ' pages not found with text \'' + text + '\'');
        console.log(pagesTextNotFound);
    }
}



async function runner_GenerateReport(urllimit, domain, domainURL, jiraTicket, debug, mock) {

    //setup the report
    var today = new Date();

    /*
    report.push([' ', 'Education report - ' + today, ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',]);
    report.push([' ', 'Results from ' + domainURL, ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',]);
    report.push([' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',]);
    report.push(['Key ', 'Missing! = no module or ERQ data was found on the page ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',]);
    report.push([' ', 'Not found = data was not found on the page (or an error occurred)', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',]);
    report.push([' ', 'N/A = not applicable for this course  ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',]);
    report.push([' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',]);
    report.push(['Note ', 'Programme code is derived from the programme specification ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',]);
    report.push([' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',]);
*/
    if (dual) {
        report.push(['Type', 'Course', 'Programme code', 'ERQs year 1?', 'ERQs year 2?', 'Modules?', 'KIS widget', 'Course start year', 'Content desc doc', 'Module year', 'Fees UK', 'Fees EU', 'Salaried fee', 'Training fee']);
    } else {
        report.push(['Type', 'Course', 'Programme code', 'ERQs year 1?', 'ERQs year 2?', 'Modules?', 'KIS widget', 'Course start year', 'Content desc doc', 'Module year', 'Fees UK', 'Fees EU', 'Salaried fee', 'Training fee']);
    }

    /*
        var missingModules = [];
        var missingERQS = [];
        var missingCCDs = [];
        var missingKISWidgetInvalid = [];
        var missingKISWidgetNotSet = [];
        var courseStartYearRange = [];
        var moduleYearRange = [];
        var feesUKRange = [];
        var feesEURange = [];
    */

    //add headers to reports
    missingERQS.push(['Type', 'Course URL', 'Year']);
    missingModules.push(['Type', 'Course URL']);
    missingKISWidgetInvalid.push(['Type', 'Course URL']);
    missingKISWidgetNotSet.push(['Type', 'Course URL']);
    missingCCDs.push(['Type', 'Course URL']);
    missingCDD404.push(['Type', 'Course URL', '404 CDD URL']);
    courseStartYearRange.push(['Type', 'Date', 'Occurences']);
    moduleYearRange.push(['Type', 'Date', 'Occurences']);
    feesEURange.push(['Type', 'Date', 'Occurences']);
    feesUKRange.push(['Type', 'Date', 'Occurences']);
    moduleInfo.push(['Course type', 'Course URL', 'Course name', 'Module year', '404 module name(s)']);

    if (mock == 'false') {
        await generateReport(urllimit, domain, debug);
    } else {

        //modules 

        //ERQs

        //KIS_invaliue

        //KIS_not set

        //CDDs

        //course start date
        courseStartYearRange.push(['UG', 'Science', 'September']);
        courseStartYearRange.push(['UG', 'Economics', 'September']);
        courseStartYearRange.push(['UG', 'Data', 'October']);
        courseStartYearRange.push(['PGT', 'Science', 'November']);
        courseStartYearRange.push(['UG', 'Science', 'November']);
        courseStartYearRange.push(['PGT', 'Science', 'November']);


        //module date 
        moduleYearRange.push(['UG', 'Science', 'September']);
        moduleYearRange.push(['UG', 'Economics', 'September']);
        moduleYearRange.push(['UG', 'Data', 'October']);
        moduleYearRange.push(['UG', 'Science', 'November']);


        //fees UK
        feesUKRange.push(['UG', 'Science', '4,000']);
        feesUKRange.push(['UG', 'Economics', '7,000']);
        feesUKRange.push(['UG', 'Data', '7,000']);
        feesUKRange.push(['UG', 'Science', '5,000']);


        //feees EU
        feesEURange.push(['UG', 'Science', '4,000']);
        feesEURange.push(['UG', 'Economics', '7,000']);
        feesEURange.push(['UG', 'Data', '7,000']);
        feesEURange.push(['UG', 'Science', '5,000']);




        //Add mock stuff here 

    }


    //count occurrences
    //
    //course start year 
    //

    var courseStartYearUG = [];
    var courseStartYearPGT = [];

    for (let index = 1; index < courseStartYearRange.length; index++) {
        const course = courseStartYearRange[index];
        var type = course[0];
        var date = course[2];

        if (type == 'UG') {
            if (courseStartYearUG[date] === undefined) {
                courseStartYearUG[date] = 1;
            }
            else {
                courseStartYearUG[date] += 1;
            }
        }
        else {
            if (courseStartYearPGT[date] === undefined) {
                courseStartYearPGT[date] = 1;
            }
            else {
                courseStartYearPGT[date] += 1;
            }
        }
    }

    var courseStartYearUGRange = [];
    for (var key in courseStartYearUG) {
        ;
        courseStartYearUGRange.push(['UG', key.toString(), courseStartYearUG[key].toString()])
    }

    var courseStartYearPGTRange = [];
    for (var key in courseStartYearPGT) {
        courseStartYearPGTRange.push(['PGT', key.toString(), courseStartYearPGT[key].toString()])
    }

    var header = [];
    header.push(['Type', 'Date', 'Occurences']);
    courseStartYearRange = header.concat(courseStartYearUGRange, courseStartYearPGTRange);

    //count occurrences
    //
    //UK fees 
    //

    var feesUKUG = [];
    var feesUKPGT = [];

    for (let index = 1; index < feesUKRange.length; index++) {
        const course = feesUKRange[index];
        var type = course[0];
        var fee = course[2];

        if (type == 'UG') {
            if (feesUKUG[fee] === undefined) {
                feesUKUG[fee] = 1;
            }
            else {
                feesUKUG[fee] += 1;
            }
        }
        else {
            if (feesUKPGT[fee] === undefined) {
                feesUKPGT[fee] = 1;
            }
            else {
                feesUKPGT[fee] += 1;
            }
        }
    }

    var feesUKUGRange = [];
    for (var key in feesUKUG) {
        ;
        feesUKUGRange.push(['UG', key.toString(), feesUKUG[key].toString()])
    }

    var feesUKPGTRange = [];
    for (var key in feesUKPGT) {
        feesUKPGTRange.push(['PGT', key.toString(), feesUKPGT[key].toString()])
    }

    header = [];
    header.push(['Type', 'Fee', 'Occurences']);
    feesUKRange = header.concat(feesUKUGRange, feesUKPGTRange);


    //count occurrences
    //
    //EU fees 
    //

    var feesEUUG = [];
    var feesEUPGT = [];

    for (let index = 1; index < feesEURange.length; index++) {
        const course = feesEURange[index];
        var type = course[0];
        var fee = course[2];

        if (type == 'UG') {
            if (feesEUUG[fee] === undefined) {
                feesEUUG[fee] = 1;
            }
            else {
                feesEUUG[fee] += 1;
            }
        }
        else {
            if (feesEUPGT[fee] === undefined) {
                feesEUPGT[fee] = 1;
            }
            else {
                feesEUPGT[fee] += 1;
            }
        }
    }

    var feesEUUGRange = [];
    for (var key in feesEUUG) {
        ;
        feesEUUGRange.push(['UG', key.toString(), feesEUUG[key].toString()])
    }

    var feesEUPGTRange = [];
    for (var key in feesEUPGT) {
        feesEUPGTRange.push(['PGT', key.toString(), feesEUPGT[key].toString()])
    }

    header = [];
    header.push(['Type', 'Fee', 'Occurences']);
    feesEURange = header.concat(feesEUUGRange, feesEUPGTRange);



    var today = new Date();
    today = today.toDateString() + ' ' + today.toLocaleTimeString();

    //write report to file - CSV
    var csv = report.map(function (d) {
        return d.join();
    }).join('\n');
    fs.writeFileSync(reportsDir + '/educationReport_' + domain + '.csv', csv);

    //write report to html
    var htmlReport = '';
    htmlReport += '<html><head></head><body>';
    htmlReport += '<h1>Digital User Experience - Course page scanner report</h1>';
    //htmlReport += '<br>';
    htmlReport += '<h2>Report date : ' + today + '</h2>';
    htmlReport += '<hr>';
    //htmlReport += '<br>';
    //htmlReport += '<br>';
    //--
    htmlReport += '<h2>Missing modules</h2>';
    htmlReport += '<div>These course pages do not contain any module information</div>';
    htmlReport += '<br>';
    if (missingModules.length > 1) {
        htmlReport += generateTable(missingModules);
    } else {
        htmlReport += 'None.';
    }

    htmlReport += '<br>';
    //--
    htmlReport += '<h2>Missing entry requirements (ERQs)</h2>';
    htmlReport += '<div>These course pages do not contain any entry requirement data</div>';
    htmlReport += '<br>';
    if (missingERQS.length > 1) {
        htmlReport += generateTable(missingERQS);
    } else {
        htmlReport += 'None.';
    }

    htmlReport += '<br>';
    //--
    htmlReport += '<h2>Missing KIS widget</h2>';
    htmlReport += '<h3>Invalid Discover Uni ID in the CMS</h3>';
    htmlReport += '<div>These course pages contain an invalid Discover Uni ID in the CMS.  The course page KIS widget will contain the error message \`undefined at undefined\'.  The Discover Uni ID needs up be updated in the CMS for each course page.  This can be achieved by finding the course on the Discover Uni website and abstracting the ID from the browser URL.</div>';
    htmlReport += '<br>';
    if (missingKISWidgetInvalid.length > 1) {
        htmlReport += generateTable(missingKISWidgetInvalid);
    } else {
        htmlReport += 'None.';
    }

    htmlReport += '<br>';
    //--
    htmlReport += '<h3>Missing Discover Uni ID in the CMS</h3>';
    htmlReport += '<div>These course pages do not contain a Discover Uni ID.  This means the Discover Uni KIS widget is not present on the course page.  The Discover Uni ID needs to be added in the CMS for each course page.  </div>';
    htmlReport += '<br>';
    if (missingKISWidgetNotSet.length > 1) {
        htmlReport += generateTable(missingKISWidgetNotSet);
    } else {
        htmlReport += 'None.';
    }
    htmlReport += '<br>';
    //--
    htmlReport += '<h2>Missing CDDs</h2>';
    htmlReport += '<div>These course pages do not contain a Course Description Document (CDD)</div>';
    htmlReport += '<br>';
    if (missingCCDs.length > 1) {
        htmlReport += generateTable(missingCCDs);
    } else {
        htmlReport += 'None.';
    }
    htmlReport += '<br>';
    //--
    htmlReport += '<h2>CDDs which 404</h2>';
    htmlReport += '<div>These course pages display a Course Description Document which 404s (the file is not found). </div>';
    htmlReport += '<br>';
    if (missingCDD404.length > 1) {
        htmlReport += generateTable(missingCDD404);
    } else {
        htmlReport += 'None.';
    }
    htmlReport += '<br>';
    //--
    htmlReport += '<h2>Course start year range</h2>';
    htmlReport += '<div>This is the current range and frequency of the different start dates on course pages. Search the data table below to identify the corresponding course pages.  This is achieved by performing an in-page text search for a specific date.  .</div>';
    htmlReport += '<br>';
    if (courseStartYearRange.length > 1) {
        htmlReport += generateTable(courseStartYearRange);
    } else {
        htmlReport += 'None.';
    }
    htmlReport += '<br>';
    //--
    //htmlReport += '<h2>Module start year range</h2>';
    //htmlReport += '<div>Scroll the list to identfy modules with strange start dates. </div>';
    //htmlReport += '<br>';
    //console.log(moduleYearRange);
    //htmlReport += generateTable(moduleYearRange);
    //htmlReport += '<br>';
    //--
    htmlReport += '<h2>Fees UK price range</h2>';
    htmlReport += '<div>This is the current range and frequency of the different UK fees on course pages. Search the data table below to identify the corresponding course pages.  This is achieved by performing an in-page text search for a specific fee. </div>';
    htmlReport += '<br>';
    htmlReport += generateTable(feesUKRange);
    htmlReport += '<br>';
    //--
    htmlReport += '<h2>Fees EU price range</h2>';
    htmlReport += '<div>This is the current range and frequency of the different EU fees on course pages. Search the data table below to identify the corresponding course pages.  This is achieved by performing an in-page text search for a specific fee. </div>';
    htmlReport += '<br>';
    feesEURange.sort(function (a, b) {
        return a[2] - b[2];
    })
    htmlReport += generateTable(feesEURange);
    htmlReport += '<br>';
    //--    
    htmlReport += '<h2>Complete eductation report</h2>';
    htmlReport += '<div>See the complete set of course page data below. </div>';
    htmlReport += '<br>';
    htmlReport += generateTable(report);
    htmlReport += '</body></html>';
    fs.writeFileSync(reportsDir + '/educationReport_' + domain + '.html', htmlReport);

    //
    //create module 404 report
    //
    var htmlModule404Report = '';
    htmlModule404Report += '<html><head></head><body>';
    htmlModule404Report += '<h1>Digital User Experience - Module 404 report</h1>';
    //htmlReport += '<br>';
    htmlModule404Report += '<h2>Report date : ' + today + '</h2>';
    htmlModule404Report += '<hr>';
    //htmlReport += '<br>';
    //htmlReport += '<br>';
    //--
    //htmlModule404Report += '<h2>Missing modules</h2>';
    htmlModule404Report += '<div>The University undergraduate and postgraduate taught course pages display modules for the current accademic year.  There is currently no facility to display all modules for all accademic years on course pages. A consequence of this is that some modules will be listed on the course page but would not exist on the website because they are from a different accaddemic year.  A user who clicks on these modules would receive a 404 page not found error.</>';
    htmlModule404Report += '<br><br>';
    htmlModule404Report += '<div>The temporary solution is to display the module information on course pages and remove the link to the specific module.</div>';
    htmlModule404Report += '<br>';
    htmlModule404Report += '<div>The list below contains the current set of modules which would 404 on the website. </div>';
    htmlModule404Report += '<br>';
    htmlModule404Report += generateTable(moduleInfo);
    htmlModule404Report += '<br>';
    fs.writeFileSync(reportsDir + '/module-404-report_' + domain + '.html', htmlModule404Report);



    //
    //create module 404 report
    //
    var htmlModuleMissingOverviewReport = '';
    htmlModuleMissingOverviewReport += '<html><head></head><body>';
    htmlModuleMissingOverviewReport += '<h1>Digital User Experience - Missing module overview report</h1>';
    //htmlReport += '<br>';
    htmlModuleMissingOverviewReport += '<h2>Report date : ' + today + '</h2>';
    htmlModuleMissingOverviewReport += '<hr>';
    //htmlReport += '<br>';
    //htmlReport += '<br>';
    //--
    //htmlModule404Report += '<h2>Missing modules</h2>';
    htmlModuleMissingOverviewReport += '<div>The University undergraduate and postgraduate taught course pages display modules for the current accademic year.  There is currently no facility to display all modules for all accademic years on course pages. A consequence of this is that some modules will be listed on the course page but would not exist on the website because they are from a different accaddemic year.  A user who clicks on these modules would receive a 404 page not found error.</>';
    htmlModuleMissingOverviewReport += '<br><br>';
    htmlModuleMissingOverviewReport += '<div>The temporary solution is to display the module information on course pages and remove the link to the specific module.</div>';
    htmlModuleMissingOverviewReport += '<br>';
    htmlModuleMissingOverviewReport += '<div>The list below contains the current set of modules which would 404 on the website. </div>';
    htmlModuleMissingOverviewReport += '<br>';
    htmlModuleMissingOverviewReport += generateTable(moduleMissingOverviewInfo);
    htmlModuleMissingOverviewReport += '<br>';
    fs.writeFileSync(reportsDir + '/module-missing-overview-report_' + domain + '.html', htmlModuleMissingOverviewReport);


    //write report to file - JSON
    const reportString = JSON.stringify(report, null, 3);
    fs.writeFileSync(reportsDir + '/educationReport_' + domain + '.json', reportString);



    //write missing modules report
    if (missingModules.length > 0) {
        var csvModules = missingModules.map(function (d) {
            return d.join();
        }).join('\n');
        fs.writeFileSync(reportsDir + '/missingModules_' + domain + '.csv', csvModules);
    }

    //write missing ERQS report
    var csvERQS;
    if (missingERQS.length > 0) {
        var csvERQS = missingERQS.map(function (d) {
            return d.join();
        }).join('\n');
        fs.writeFileSync(reportsDir + '/missingERQs_' + domain + '.csv', csvERQS);
        //fs.writeFileSync('./missingModules_' + domain + '.csv', missingModules.toString());
    }


    //write module 404 report
    var csvMODULE;
    if (moduleInfo.length > 0) {
        var csvMODULE = moduleInfo.map(function (d) {
            return d.join();
        }).join('\n');

        //console.log(csvMODULE);
        fs.writeFileSync(reportsDir + '/module404Info_' + domain + '.csv', csvMODULE);
        fs.writeFileSync(reportsDir + '/module404InfoArray_' + domain + '.csv', csvMODULE.toString());
    }


    //update ticket with misisng modules and ERQs
    var COMMENT = missingERQS.toString();

    var ticketComment = 'Missing modules - ' + today;

    var bulletList = ``;
    var test = ``;
    for (let index = 0; index < missingModules.length; index++) {

        bulletList = bulletList + `{
            "type": "listItem",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "${missingModules[index]}"
                  }
                ]
              }
            ]
          }`;

        test = test + `hello`;

        if (index != missingModules.length - 1) {
            bulletList = bulletList + `,`;

        }
    }

    console.log('');

    if (missingERQS.length > 1) {
        console.log('Missing ERQS');
        console.log(csvERQS);
        console.log('');
        console.log(missingERQS);
    }

    if (missingModules.length > 0) {
        console.log('Missing modules');
        console.log(missingModules);
        console.log('');
    }

    // // upload reports to jira
    // if (jiraTicket !== undefined) {
    //     console.log('');
    //     console.log('');
    //     console.log('Attaching reports to Jira ticket number ' + jiraTicket);

    //     // delete attachments
    //     await deleteAttachmentIDs(jiraTicket);

    //     // attach reports to jira ticket
    //     await addIssueAttachmentCurl(reportsDir + '/educationReport_' + domain + '.csv', jiraTicket);
    //     if (missingModules.length > 0) {
    //         await addIssueAttachmentCurl(reportsDir + '/missingModules_' + domain + '.csv', jiraTicket);
    //     }
    //     if (missingERQS.length > 1) {
    //         await addIssueAttachmentCurl(reportsDir + '/missingERQs_' + domain + '.csv', jiraTicket);
    //     }
    //     if (missingERQS.length > 1) {
    //         await addIssueAttachmentCurl(reportsDir + '/module404Info_' + domain + '.csv', jiraTicket);
    //     }

    //     // add a comment to the ticket
    //     updateJIRATicket(jiraTicket, 'Report updated on ' + today + '.');
    // }

    //upload the module 404 report
    //if (moduleInfo.length > 0) {
    //    await deleteAttachmentIDs('OWP-2600');
    //    await addIssueAttachmentCurl(reportsDir + '/module404Info_' + domain + '.csv', 'OWP-2600');
    //    updateJIRATicket(jiraTicket, 'Report updated on ' + today + '.');
    // }

    //print missing CCDs
    console.log('Missing CCDs = ' + missingCCDs.length);
    console.log(missingCCDs);

}



const argv = yargs
    .options("domain", {
        alias: "d",
        description: "Drupal domain to scrape (prod, pprd, dev, live",
        type: "string",
    })
    .options("findtext", {
        alias: "f",
        description: "Find specific text on a course page",
        type: "string",
    })
    .options("urllimit", {
        alias: "u",
        description: `Set maximum number of URLs (test mode); 0 = all URLs`,
        type: "string"
    })
    .options("jiraticket", {
        alias: "j",
        description: "Jira ticket to attach report",
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
    //.choices("s", settings)
    .default("u", 0)
    .default("f", '')
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

    case 'drupal9':
        console.log('Testing external domain');
        siteURLS = URLs.getTestURLs('drupal9', 'education');
        domainURL = 'https://drupal9.soton.ac.uk';
        break;
}

if (argv.gebug == 'true') {
    console.log('debug true');
} else {
    console.log('debug false');
}

console.log('Adding report to Jira ticket ' + argv.jiraticket);

if (argv.findtext != '') {
    runner_FindText(argv.findtext, argv.urllimit, argv.jiraticket, argv.domainURL);
} else {
    runner_GenerateReport(argv.urllimit, argv.domain, domainURL, argv.jiraticket, argv.gebug, argv.mock);
}


