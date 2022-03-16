const fs = require('fs');
const puppeteer = require('puppeteer');
const yargs = require("yargs");
const htmlFunctions = require('../local-modules/html-functions');
const urlGenerator = require('../local-modules/site-urls');
const globalSettings = require('../local-modules/report-settings');
const { exit } = require('process');
const { time } = require('console');
const { exitProcess } = require('yargs');

const REPORTS_DATA_FOLDER = globalSettings.getReportsFolder();
const URL_LISTS_FOLDER = globalSettings.getUrlListsFolder();


//global variables
var personData = [];
var siteURLS;
var totalProfileCount = 0;
var totalPageLoadTime;
var titleCount = [];
var performanceLevel1 = 0;
var performanceLevel2 = 0;
var performanceLevel3 = 0;
var performanceLevel4 = 0;
var performanceLevel5 = 0;
var PERFLEVEL1 = 1;
var PERFLEVEL2 = 2;
var PERFLEVEL3 = 4;
var PERFLEVEL4 = 8;
var PERFLEVEL5 = 20;
var performanceLevel1Data = [];
var performanceLevel2Data = [];
var performanceLevel3Data = [];
var performanceLevel4Data = [];
var performanceLevel5Data = [];
var performanceLevelSummaryData = [];




//count number of occurrences of a data item
var personPhotoCount = 0;
var personNameCount = 0;
var personTitleCount = 0;
var personPostNominalLettersCount = 0;
var personResearchInterestsHeroCount = 0;
var personPhDStudentsCount = 0;
var personEmailCount = 0;
var personTelephoneCount = 0;
var personAddressCount = 0;
var personGoogleScholarCount = 0;
var personORCIDCount = 0;
var personLinkedInCount = 0;
var personTwitterCount = 0;
var personAboutCount = 0;
var personResearchGroupsCount = 0;
var personResearchInterestsCount = 0;
var personResearchCurrentCount = 0;
var personResearchProjectsActiveCount = 0;
var personResearchProjectsCompletedCount = 0;
var personPublicationsCount = 0;
var personSupervisionCurrentCount = 0;
var personSupervisionPreviousCount = 0;
var personTeachingIntroCount = 0;
var personTeachingModulesCount = 0;
var personRolesCount = 0;
var personBiographyCount = 0;
var personPrizesCount = 0;

function getTimestamp() {
    let date_ob = new Date();

    // adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);

    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    // current year
    let year = date_ob.getFullYear();

    // current hours
    let hours = date_ob.getHours();

    // current minutes
    let minutes = date_ob.getMinutes();

    // current seconds
    let seconds = date_ob.getSeconds();

    // prints date & time in YYYY-MM-DD HH:MM:SS format
    var timestamp = year + "-" + month + "-" + date + "-" + hours + "-" + minutes + "-" + seconds;
    return timestamp;
}


async function generateReport(urllimit, domain, debug) {

    if (urllimit == 0) {
        urllimit = siteURLS.length
    }

    totalProfileCount = urllimit;

    console.log(siteURLS.length);

    console.log('');
    console.log('Generating staff profile report for ' + urllimit + ' people:');

    var browser;
    var page;
    var personSocialMedia = [];
    var refreshPageInstanceCount = 0;



    //open the browser and use one page to get the data
    //much quicker
    try {
        browser = await puppeteer.launch();
        page = await browser.newPage();
        await page.setDefaultNavigationTimeout(120000);
        await page.goto('https://oneweb.pprd.soton.ac.uk');
        //await page.setViewport({ width: 1300, height: 5000 });
    } catch (error) {
        console.log('Unable to startup browser ' + error);
        process.exit();
    }

    var timeBeforeRun = new Date();

    for (let i = 0; i < urllimit; i++) {

        //count the number of data matches per profile
        var personDataCount = 0;
        refreshPageInstanceCount++;

        const YES = 'YES';
        const NO = 'NO';

        var personPhotoFound = NO;
        var personNameFound = NO;
        var personTitleFound = NO;
        var personPostNominalLettersFound = NO;
        var personResearchInterestsHeroFound = NO;
        var personPhDStudentsFound = NO;

        var personEmailFound = NO;
        var personTelephoneFound = NO;
        var personAddressFound = NO;
        var personGoogleScholarFound = NO;
        var personORCIDFound = NO;
        var personLinkedInFound = NO;
        var personTwitterFound = NO;

        var personAboutFound = NO;
        var personResearchGroupsFound = NO;
        var personResearchInterestsFound = NO;
        var personResearchCurrentFound = NO;
        var personResearchProjectsActiveFound = NO;
        var personResearchProjectsCompletedFound = NO;
        var personPublicationsFound = NO;
        var personSupervisionCurrentFound = NO;
        var personSupervisionPreviousFound = NO;
        var personTeachingIntroFound = NO;
        var personTeachingModulesFound = NO;
        var personRolesFound = NO;
        var personBiographyFound = NO;
        var personPrizesFound = NO;

        var personPublicationsTotal = 0;
        var personTitleValue = '';
        var personPostNominalLettersValue = '';
        var personNameValue = '';
        var personNameSuffix = '';

        //siteURLS = ['https://oneweb.pprd.soton.ac.uk/people/professor-david-richardson', 'https://oneweb.pprd.soton.ac.uk/people/professor-lajos-hanzo','https://oneweb.pprd.soton.ac.uk/people/professor-david-richardson', 'https://oneweb.pprd.soton.ac.uk/people/professor-lajos-hanzo','https://oneweb.pprd.soton.ac.uk/people/professor-david-richardson', 'https://oneweb.pprd.soton.ac.uk/people/professor-lajos-hanzo','https://oneweb.pprd.soton.ac.uk/people/professor-david-richardson', 'https://oneweb.pprd.soton.ac.uk/people/professor-lajos-hanzo'];

        //siteURLS = ['https://oneweb.pprd.soton.ac.uk/people/professor-age-chapman', 'https://oneweb.pprd.soton.ac.uk/people/mr-paul-thwaite'];

        try {

            // setup the browser and go to the test url
            //browser = await puppeteer.launch();
            var personURL = siteURLS[i][0].toString();
            var personUsername = siteURLS[i][1].toString();
            var personFaculty = siteURLS[i][2].toString();
            var personSchool = siteURLS[i][3].toString();
            var personSchoolDepartment = siteURLS[i][4].toString();
            personSchoolDepartment = personSchoolDepartment.replace(/,/g, " ");

            //personURL = 'https://oneweb.pprd.soton.ac.uk/people/alexander-mortensen';
            //output progress
            console.log(i + " - " + personURL);

            try {
                //await page.waitForNavigation();
                //await page.waitForSelector('html');

                if (refreshPageInstanceCount == 1000) {
                    console.log('Page load threshold met. Starting a new browser session.');
                    await page.close();
                    console.log('--> closed page');
                    await browser.close();
                    console.log('--> closed browser');
                    //browser = await puppeteer.launch();
                    browser = await puppeteer.launch({
                      timeout: 120000,
                      headless: true,
                      args: ['--no-sandbox']
                  });
                    console.log('--> launched new browser');
                    page = await browser.newPage();
                    console.log('--> launched new page');
                    await page.setDefaultNavigationTimeout(120000);
                    await page.goto('https://oneweb.soton.ac.uk');
                    console.log('--> loaded test page, ready to carry on');
                    refreshPageInstanceCount = 0;
                  }

                var timeBefore = new Date();
                await page.goto(personURL);
                var timeAfter = new Date();
                var personPageLoadTime = (timeAfter - timeBefore) / 1000;
                personPageLoadTime = personPageLoadTime.toFixed(2);

            } catch (error) {
                if (error.toString().indexOf('Navigation failed because browser has disconnected!') != -1) {
                    console.log('Error detected with the browser.  Starting a new browser.');
                    browser = await puppeteer.launch();
                    page = await browser.newPage();
                    await page.setDefaultNavigationTimeout(120000);

                    var timeBefore = new Date();
                    await page.goto(personURL);
                    var timeAfter = new Date();
                    var personPageLoadTime = (timeAfter - timeBefore) / 1000;
                    personPageLoadTime = personPageLoadTime.toFixed(2);
                }

                if (error.toString().indexOf('Execution context was destroyed, most likely because of a navigation') != -1) {
                    console.log('Error detected in navigation. Trying again with profile ' + personURL);

                    var timeBefore = new Date();
                    await page.goto(personURL);
                    var timeAfter = new Date();
                    var personPageLoadTime = (timeAfter - timeBefore) / 1000;
                    personPageLoadTime = personPageLoadTime.toFixed(2);
                }

                console.log(error);

            }


            //person hero
            var personPhoto = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div:nth-child(1) > div > div > div > img'), img => img.getAttribute('src')));
            var personPhDStudents = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div:nth-child(3) > p > span.pl-8'), element => element.textContent));
            var personName = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > h1'), element => element.textContent));
            var personTitle = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div.pb-6.text-xl'), element => element.textContent));
            var personPostNominalLetters = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > span'), element => element.textContent));
            var personResearchInterestsHero = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > ul > li:nth-child(1)'), element => element.textContent));
            var personEmail = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > div > div.flex-1.pb-3 > p:nth-child(1) > a'), element => element.textContent));
            //can be hidden under chevron
            if (personEmail.length == 0) {
                var personEmail = await page.evaluate(() => Array.from(document.querySelectorAll('#contact-details > div > div.flex-1.pb-3 > p:nth-child(1) > a'), element => element.textContent));
            }
            var personTelephone = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > div > div.flex-1.pb-3 > p:nth-child(2) > a'), element => element.textContent));
            //can be hidden under chevron
            if (personTelephone.length == 0) {
                var personTelephone = await page.evaluate(() => Array.from(document.querySelectorAll('#contact-details > div > div.flex-1.pb-3 > p:nth-child(2) > a'), element => element.textContent));
            }

            var personAddress = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > div > div > p > span > a'), a => a.getAttribute('href')));
            //can be hidden under chevron
            if (personAddress.length == 0) {
                var personAddress = await page.evaluate(() => Array.from(document.querySelectorAll('#contact-details > div > div > p > strong'), element => element.textContent));
            }

            var personGoogleScholar = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > div > div > ul > li:nth-child(1) > a'), a => a.getAttribute('href')));
            var personORCID = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > div > div > ul > li:nth-child(2) > a'), a => a.getAttribute('href')));
            var personLinkedIn = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > div > div > ul > li:nth-child(3) > a'), a => a.getAttribute('href')));
            var personTwitter = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > div > div > ul > li:nth-child(4) > a'), a => a.getAttribute('href')));

            //social media links
            personSocialMedia[0] = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > div > div > ul > li:nth-child(1) > a'), a => a.getAttribute('href')));
            personSocialMedia[1] = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > div > div > ul > li:nth-child(2) > a'), a => a.getAttribute('href')));
            personSocialMedia[2] = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > div > div > ul > li:nth-child(3) > a'), a => a.getAttribute('href')));
            personSocialMedia[3] = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > div > div > div > div > div > div > ul > li:nth-child(4) > a'), a => a.getAttribute('href')));

            //social media
            var personGoogleScholar = -1;
            var personORCID = -1;
            var personLinkedIn = -1;
            var personTwitter = -1;

            try {
                itemSelector = "#main-content";
                pageText = await page.evaluate((selector) => {
                    return document.querySelector(selector).textContent;
                }, itemSelector);

                //ORCHID
                personORCID = pageText.indexOf('ORCID');

                //Google scholar
                personGoogleScholar = pageText.indexOf('Scholar');

                //LinkedIn
                personLinkedIn = pageText.indexOf('LinkedIn');

                //Twitter
                personTwitter = pageText.indexOf('Twitter');


            } catch (error) {
                console.log(error);
                // teaching tab not on page
            }

            //
            //person tabs
            //

            //tab about
            var personAbout = await page.evaluate(() => Array.from(document.querySelectorAll('#about > section > p:nth-child(1)'), element => element.textContent));

            //tab research
            var personResearchGroups = -1;
            var personResearchInterests = -1;
            var personResearchCurrent = -1;
            var personResearchProjectsActive = -1;
            var personResearchProjectsCompleted = -1;

            try {
                let itemSelector = "#research";

                if ((await page.$(itemSelector)) !== null) {

                    var pageText = await page.evaluate((selector) => {
                        return document.querySelector(selector).textContent;
                    }, itemSelector);

                    //research groups 
                    personResearchGroups = pageText.indexOf('Research groups');

                    //research interests
                    personResearchInterests = pageText.indexOf('Research interests');

                    //research current
                    personResearchCurrent = pageText.indexOf('Current research');

                    //research projects active
                    personResearchProjectsActive = pageText.indexOf('Active projects');

                    //research projects completed
                    personResearchProjectsCompleted = pageText.indexOf('Completed projects');
                }

            } catch (error) {

                console.log(error);

            }

            //tab publications
            var personPublications = await page.evaluate(() => Array.from(document.querySelectorAll('#publications > h2'), element => element.textContent));
            var personPublicationsTotal = await page.evaluate(() => Array.from(document.querySelectorAll('#publications > section > div > div > header'), element => element.textContent));
            if (personPublications.length > 0) {
                var text = personPublicationsTotal[0].toString().trim();
                //console.log(text);
                var parts = text.split(' ');
                personPublicationsTotal = parts[0];
                //console.log('# pubs = ' + personPublicationsTotal);
            }

            //#publications > section > div > div > heade
            //var parts = personPublicationsTotal.split(' ');
            //personPublicationsTotal = parts[0];
            //console.log('# pubs = ' + personPublicationsTotal);

            //tab teaching
            var personTeachingIntro = -1;
            var personTeachingModules = -1;
            var personTeachingCode = -1;
            try {
                itemSelector = "#teaching";

                if ((await page.$(itemSelector)) !== null) {
                    // do things with its content
                    pageText = await page.evaluate((selector) => {
                        return document.querySelector(selector).textContent;
                    }, itemSelector);

                    //teaching intoduction
                    //personTeachingIntro = pageText.indexOf('Teaching');

                    //teaching modules
                    personTeachingModules = pageText.indexOf('Module');
                    personTeachingCode = pageText.indexOf('Code');
                }
            } catch (error) {
                console.log(error);
            }


            var personTeachingQuantity = 0;
            if ((personTeachingModules >= 0) && (personTeachingCode >= 0)) {

                personTeachingQuantity = await page.evaluate(() => Array.from(document.querySelector(' #teaching > section > table > tbody').children).length);
            }

            personTeachingIntro = await page.evaluate(() => Array.from(document.querySelectorAll('#teaching > section > p'), element => element.textContent));

            //tab supervision
            var personSupervisionCurrent = await page.evaluate(() => Array.from(document.querySelectorAll('#supervision-current-students > h3'), element => element.textContent));
            var personSupervisionPrevious = await page.evaluate(() => Array.from(document.querySelectorAll('#supervision-previous-students > h3'), element => element.textContent));
            //var personSupervisionCurrentQuantity = await page.evaluate(() => Array.from(document.querySelectorAll('#supervision-current-students'), element => element.textContent));

            var personSupervisionCurrentQuantity = 0;
            if (personSupervisionCurrent.length > 0) {

                personSupervisionCurrentQuantity = await page.evaluate(() => Array.from(document.querySelector('#supervision-current-students').children).length);
                personSupervisionCurrentQuantity--;
            }

            //tab roles and responsibilities
            var personRoles = await page.evaluate(() => Array.from(document.querySelectorAll('#roles > section > div > div:nth-child(1) > div:nth-child(1) > span:nth-child(2)'), element => element.textContent));

            //tab biography
            var personBiography = await page.evaluate(() => Array.from(document.querySelectorAll('#biography > h2'), element => element.textContent));
            var personPrizes = await page.evaluate(() => Array.from(document.querySelectorAll('#biography > section > h3'), element => element.textContent));

            if (debug == 'true') {

                console.log('Hero');
                console.log('Photo --> ' + personPhoto);
                console.log('Name --> ' + personName);
                console.log('Title --> ' + personTitle);
                console.log('Post nominal letters --> ' + personPostNominalLetters);
                console.log('Research interests --> ' + personResearchInterestsHero);
                console.log('Accepting phd students --> ' + personPhDStudents);
                console.log('');
                console.log('Email --> ' + personEmail);
                console.log('Telephone --> ' + personTelephone);
                console.log('Address --> ' + personAddress);
                console.log('Google Scholar --> ' + personGoogleScholar);
                console.log('Orchid --> ' + personORCID);
                console.log('LinkedIn --> ' + personLinkedIn);
                console.log('Twitter --> ' + personTwitter);
                console.log('');
                console.log('Tabs');
                console.log('About --> ' + personAbout);
                console.log('Research - Research groups --> ' + personResearchGroups);
                console.log('Research - Research interests --> ' + personResearchInterests);
                console.log('Research - Current research --> ' + personResearchCurrent);
                console.log('Research - Research projects active --> ' + personResearchProjectsActive);
                console.log('Research - Research projects completed --> ' + personResearchProjectsCompleted);
                console.log('Publications --> ' + personPublications);
                console.log('Supervision current --> ' + personSupervisionCurrent);
                console.log('Supervision previous --> ' + personSupervisionPrevious);
                console.log('Teaching intro --> ' + personTeachingIntro);
                console.log('Teaching modules --> ' + personTeachingModules);
                console.log('Roles --> ' + personRoles);
                console.log('Biography --> ' + personBiography);
                console.log('Prizes --> ' + personPrizes);
            }

            if (personPhoto.length > 0) {
                personPhotoFound = YES;
                personPhotoCount++;
                personDataCount++;
            }
            if (personName.length > 0) {
                personNameFound = YES;
                personNameCount++;
                personDataCount++;
                personNameValue = personName;
                var tmp = personName.toString().split(' ');
                personNameSuffix = tmp[0];
            }
            if (personTitle[0] != undefined) {
                if (personTitle[0].length > 1) {
                    personTitleFound = YES;
                    personTitleCount++;
                    personDataCount++;
                    personTitleValue = personTitle[0].replace(/,/g, " ");;
                }
            }
            if (personPostNominalLetters[0] != undefined) {
                if (personPostNominalLetters[0].length > 1) {
                    personPostNominalLettersFound = YES;
                    personPostNominalLettersCount++;
                    personDataCount++;
                    personPostNominalLettersValue = personPostNominalLetters[0];
                }
            }
            if (personResearchInterestsHero.length > 0) {
                personResearchInterestsHeroFound = YES;
                personResearchInterestsHeroCount++;
                personDataCount++;
            }
            if (personPhDStudents.length > 0) {
                personPhDStudentsFound = YES;
                personPhDStudentsCount++;
                personDataCount++;
            }
            if (personEmail.length > 0) {
                personEmailFound = YES;
                personEmailCount++;
                personDataCount++;
            }
            if (personTelephone.length > 0) {
                personTelephoneFound = YES;
                personTelephoneCount++;
                personDataCount++;
            }
            if (personAddress.length > 0) {
                personAddressFound = YES;
                personAddressCount++;
                personDataCount++;
            }
            if (personGoogleScholar > 0) {
                personGoogleScholarFound = YES;
                personGoogleScholarCount++;
                personDataCount++;
            }
            if (personORCID >= 0) {
                personORCIDFound = YES;
                personORCIDCount++;
                personDataCount++;
            }
            if (personLinkedIn >= 0) {
                personLinkedInFound = YES;
                personLinkedInCount++;
                personDataCount++;
            }
            if (personTwitter >= 0) {
                personTwitterFound = YES;
                personTwitterCount++;
                personDataCount++;
            }
            if (personAbout.length > 0) {
                personAboutFound = YES;
                personAboutCount++;
                personDataCount++;
            }
            if (personResearchGroups >= 0) {
                personResearchGroupsFound = YES;
                personResearchGroupsCount++;
                personDataCount++;
            }
            if (personResearchInterests >= 0) {
                personResearchInterestsFound = YES;
                personResearchInterestsCount++;
                personDataCount++;
            }
            if (personResearchCurrent >= 0) {
                personResearchCurrentFound = YES;
                personResearchCurrentCount++;
                personDataCount++;
            }
            if (personResearchProjectsActive >= 0) {
                personResearchProjectsActiveFound = YES;
                personResearchProjectsActiveCount++;
                personDataCount++;
            }
            if (personResearchProjectsCompleted >= 0) {
                personResearchProjectsCompletedFound = YES;
                personResearchProjectsCompletedCount++;
                personDataCount++;
            }
            if (personTeachingIntro.length > 0) {
                personTeachingIntroFound = YES;
                personTeachingIntroCount++;
                personDataCount++;
            }
            if (personTeachingModules >= 0) {
                personTeachingModulesFound = YES;
                personTeachingModulesCount++;
                personDataCount++;
            }
            if (personSupervisionCurrent.length > 0) {
                personSupervisionCurrentFound = YES;
                personSupervisionCurrentCount++;
                personDataCount++;
            }
            if (personSupervisionPrevious.length > 0) {
                personSupervisionPreviousFound = YES;
                personSupervisionPreviousCount++;
                personDataCount++;
            }
            if (personPublications.length > 0) {
                personPublicationsFound = YES;
                personPublicationsCount++;
                personDataCount++;
            }
            if (personRoles.length > 0) {
                personRolesFound = YES;
                personRolesCount++;
                personDataCount++;
            }
            if (personBiography.length > 0) {
                personBiographyFound = YES;
                personBiographyCount++;
                personDataCount++;
            }
            if (personPrizes.length > 0) {
                personPrizesFound = YES;
                personPrizesCount++;
                personDataCount++;
            }

            //count the number of titles
            // a URL looks like https://oneweb.pprd.soton.ac.uk/people/mr-gilberto-zanfino
            // we need the title e.g mr
            /*
            var parts = personURL.split('/');
            console.log(parts[4]);
            var subparts = parts[4].split['-'];
            var title = subparts[0];
            if (titleCount[title] == undefined)
            {
                titleCount[title] = 1;
            }
            else
            {
                titleCount[title]++;
            }*/

            //
            //add data to an array
            //
            personData.push([personURL, personPageLoadTime.toString(), personDataCount.toString(), personPhotoFound, personNameFound, personTitleFound, personResearchInterestsHeroFound, personPhDStudentsFound, personEmailFound, personTelephoneFound, personAddressFound, personGoogleScholarFound, personORCIDFound, personLinkedInFound, personTwitterFound, personAboutFound, personResearchGroupsFound, personResearchInterestsFound, personResearchCurrentFound, personResearchProjectsActiveFound, personResearchProjectsCompletedFound, personPublicationsFound, personSupervisionCurrentFound, personTeachingIntroFound, personTeachingModulesFound, personRolesFound, personBiographyFound, personPrizesFound, personNameValue, personNameSuffix, personPublicationsTotal, personTitleValue, personEmail, personFaculty, personSchool, personSchoolDepartment, personUsername, personSupervisionCurrentQuantity.toString(), personTeachingQuantity.toString()]);

            //
            //allocate performance level
            //
            if (personPageLoadTime < PERFLEVEL1) {
                performanceLevel1++;
                performanceLevel1Data.push([personURL, personPageLoadTime, personPublicationsFound, personPublicationsTotal, personResearchGroupsFound, personResearchProjectsActiveFound]);
            }
            if ((personPageLoadTime >= PERFLEVEL1) && (personPageLoadTime < PERFLEVEL3)) {
                performanceLevel2++;
                performanceLevel2Data.push([personURL, personPageLoadTime, personPublicationsFound, personPublicationsTotal, personResearchGroupsFound, personResearchProjectsActiveFound]);
            }
            if ((personPageLoadTime >= PERFLEVEL3) && (personPageLoadTime < PERFLEVEL4)) {
                performanceLevel3++;
                performanceLevel3Data.push([personURL, personPageLoadTime, personPublicationsFound, personPublicationsTotal, personResearchGroupsFound, personResearchProjectsActiveFound]);
            }
            if ((personPageLoadTime >= PERFLEVEL4) && (personPageLoadTime < PERFLEVEL5)) {
                performanceLevel4++;
                performanceLevel4Data.push([personURL, personPageLoadTime, personPublicationsFound, personPublicationsTotal, personResearchGroupsFound, personResearchProjectsActiveFound]);
            }
            if (personPageLoadTime >= PERFLEVEL5) {
                performanceLevel5++;
                performanceLevel5Data.push([personURL, personPageLoadTime, personPublicationsFound, personPublicationsTotal, personResearchGroupsFound, personResearchProjectsActiveFound]);
            }
            //console.log(i);

            /*const perfEntries = JSON.parse(
                await page.evaluate(() => JSON.stringify(performance.getEntries()))
              );
              
              console.log(perfEntries);*/


        } catch (error) {

            console.log('Problem detected with ' + personURL);
            console.log(error);

            if (error.toString().indexOf('ERR_CONNECTION_REFUSED')) {
                process.exit();
            }

            //await page.close();
            //page = await browser.newPage();
        };
    }

    var timeAfterRun = new Date();
    totalPageLoadTime = (timeAfterRun - timeBeforeRun) / 1000;
    totalPageLoadTime = totalPageLoadTime.toFixed(2);

    await browser.close();
}


async function createStackedChart(domain, data) {

    //fetch a simple timestamp
    var timestamp = globalSettings.getTimestamp('today', 'yymmdd');

    let chartDataYes = [];
    let chartDataNo = [];

    for (let index = 0; index < 29; index++) {
        chartDataYes[index] = 0;
        chartDataNo[index] = 0;
    }


    for (let row = 0; row < data.length; row++) {
        const theRow = data[row];

        for (let column = 3; column < 29; column++) {
            const theColumn = data[row][column];

            if (theColumn == 'YES') {
                chartDataYes[column - 3]++;
            } else {
                chartDataNo[column - 3]++;
            }
        }
    }

    console.log(chartDataYes);
    console.log(chartDataNo);

    let LABELS = "['Photo', 'Name', 'Title', 'Research interests', 'Accepting PhD students', 'Email', 'Telephone', 'Address', 'Google scholar', 'ORCID', 'LinkedIn', 'Twitter', 'About', 'Research groups', 'Research interests', 'Current research', 'Research projects active', 'Research projects completed', 'Publications', 'Supervision current', 'Teaching intro', 'Teaching modules', 'Roles', 'Biography', 'Prizes']";

    //let LABELS = "['PHOTO', 'TITLE', 'NOMINAL']";
    let YES_DATA = [3, 70, 700];
    let NO_DATA = [78, 3, 100];

    let htmlDocument = ` <html>
    <head>
      <!-- Required meta tags -->
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Staff profile data field analysis</title>
      <!--Chart.js JS CDN-->
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
      <div>
        <canvas id="myChart" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas>
      </div>
      <script>
        var ctx = document.getElementById('myChart').getContext('2d');
    
        const CHART_COLORS = {
          red: 'rgb(255, 99, 132)',
          orange: 'rgb(255, 159, 64)',
          yellow: 'rgb(255, 205, 86)',
          green: 'rgb(75, 192, 192)',
          blue: 'rgb(54, 162, 235)',
          purple: 'rgb(153, 102, 255)',
          grey: 'rgb(201, 203, 207)'
        };
    
        const data = {
          labels: ${LABELS},
          datasets: [
            {
              label: 'Field contains data',
              data: [${chartDataYes}],
              backgroundColor: CHART_COLORS.green,
            },
            {
              label: 'Field empty',
              data: [${chartDataNo}],
              backgroundColor: CHART_COLORS.red,
            },
          ]
        };
    
        var myChart = new Chart(ctx, {
          type: 'bar',
          data: data,
          options: {
            plugins: {
              title: {
                display: true,
                text: 'STAFF PROFILE PROGRESS SINCE BETA LAUNCH ON 2 DECEMBER',
                color: 'black',
                  font: {
                    size: 16,
                    family: 'tahoma',
                    weight: 'bold',
                    style: 'normal'
                  },
                },
                subtitle: {
                  display: true,
                  text: 'Staff profiles added and removed (Subscribe user profile made public or private)',
                  color: 'black',
                  font: {
                    size: 14,
                    family: 'tahoma',
                    weight: 'normal',
                    style: 'normal'
                  },
                  padding: {
                    bottom: 10
                  }
                }
            },
            responsive: true,
            scales: {
              x: {
                stacked: true,
              },
              y: {
                stacked: true
              }
            }
          }
        })
      </script>
    </body>
    </html>`;

    //fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/field-progress/graph/staff-profile-field-progress-' + timestamp + '.html', htmlDocument);


}


async function createStackedGroupedChart(domain, data) {

    //fetch the date
    var timestamp = globalSettings.getTimestamp('today', 'yymmdd');

    let chartDataYes = [];
    let chartDataNo = [];

    for (let index = 0; index < 29; index++) {
        chartDataYes[index] = 0;
        chartDataNo[index] = 0;
    }

    for (let row = 0; row < data.length; row++) {
        const theRow = data[row];

        for (let column = 3; column < 29; column++) {
            const theColumn = data[row][column];

            if (theColumn == 'YES') {
                chartDataYes[column - 3]++;
            } else {
                chartDataNo[column - 3]++;
            }

        }
    }

    let launchDataYes = '299,4855,3498,3,13,4855,2257,2467,16,1228,19,21,4,40,2,15,326,656,2347,0,1113,897,895,371,1,237,0,0,0';

    console.log(chartDataYes);
    console.log(chartDataNo);

    let LABELS = "['Photo', 'Name', 'Title', 'Research interests', 'Accepting PhD students', 'Email', 'Telephone', 'Address', 'Google scholar', 'ORCID', 'LinkedIn', 'Twitter', 'About', 'Research groups', 'Research interests', 'Current research', 'Research projects active', 'Research projects completed', 'Publications', 'Supervision current', 'Supervision previous', 'Teaching intro', 'Teaching modules', 'Roles', 'Biography', 'Prizes']";

    //LABELS = "['Photo (SUBSCRIBE)', 'Name', 'Title', 'Research interests (PURE)', 'Accepting PhD students (PURE)', 'Email (SUBSCRIBE)', 'Telephone (SUBSCRIBE)', 'Address (SUBSCRIBE)', 'Google scholar (PURE)', 'ORCID (PURE)', 'LinkedIn (PURE)', 'Twitter (PURE)', 'About (PURE)', 'Research groups', 'Research interests (PURE)', 'Current research (PURE)', 'Research projects active', 'Research projects completed', 'Publications', 'Supervision current', 'Supervision previous', 'Teaching intro (PURE)', 'Teaching modules', 'Roles (PURE)', 'Biography (PURE)', 'Prizes (PURE)']";


    //let LABELS = "['PHOTO', 'TITLE', 'NOMINAL']";
    let YES_DATA = [3, 70, 700];
    let NO_DATA = [78, 3, 100];

    let htmlDocument = ` <html>
    <head>
      <!-- Required meta tags -->
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chart.js Integration</title>
      <!--Chart.js JS CDN-->
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <link rel="stylesheet" type="text/css" href="../../css/dux-dashboard.css" />
    </head>
    <body>
      <div>
        <canvas id="myChart" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas>
      </div>
      <script>
        var ctx = document.getElementById('myChart').getContext('2d');
    
        const CHART_COLORS = {
          red: 'rgb(255, 99, 132)',
          orange: 'rgb(255, 159, 64)',
          yellow: 'rgb(255, 205, 86)',
          green: 'rgb(75, 192, 192)',
          blue: 'rgb(54, 162, 235)',
          purple: 'rgb(153, 102, 255)',
          grey: 'rgb(201, 203, 207)'
        };
    
        const data = {
          labels: ${LABELS},
          datasets: [
            {
              label: 'BETA LAUNCH - 2 DEC',
              data: [${launchDataYes}],
              backgroundColor: CHART_COLORS.green,
              stack: 'Stack 0',
            },
            {
              label: 'LATEST - 15 DEC',
              data: [${chartDataYes}],
              backgroundColor: CHART_COLORS.blue,
              stack: 'Stack 1',
            },
          ]
        };
    
        var myChart = new Chart(ctx, {
          type: 'bar',
          data: data,
          options: {
            plugins: {
                title: {
                  display: true,
                  text: 'STAFF PROFILE PROGRESS SINCE BETA LAUNCH - 149 NEW PROFILES ADDED',
                  color: 'black',
                  font: {
                    size: 16,
                    family: 'tahoma',
                    weight: 'bold',
                    style: 'normal'
                  },
                },
                subtitle: {
                  display: true,
                  text: 'Completeness across all staff profile data-driven fields',
                  color: 'black',
                  font: {
                    size: 14,
                    family: 'tahoma',
                    weight: 'normal',
                    style: 'normal'
                  },
                  padding: {
                    bottom: 10
                  }
                }
              },
          }
        })
      </script>
    </body>
    </html>`;

    //fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/field-progress/graph/staff-profile-field-progress-graph-' + timestamp + '.html', htmlDocument);


}





async function runner_GenerateReport(urllimit, domain, debug) {

    //fetch the data
    await generateReport(urllimit, domain, debug);

    //count the data for charts
    //var PHOTO_DATA = await countData(1);
    await createStackedChart(domain, personData);
    await createStackedGroupedChart(domain, personData);


    //create the data charts


    //fetch the date
    var timestamp = globalSettings.getTimestamp('today', 'yymmdd');

    //make two copies of the personArray
    var personDataIndex = personData.map(function (arr) {
        return arr.slice();
    });

    //make two copies of the personArray
    var personDataLoadTime = personData.map(function (arr) {
        return arr.slice();
    });

    //
    //build the performance summary table
    //
    var performanceLevel1Percentage = 0;
    var performanceLevel2Percentage = 0;
    var performanceLevel3Percentage = 0;
    var performanceLevel4Percentage = 0;
    var performanceLevel5Percentage = 0;
    if (performanceLevel1 > 0) { performanceLevel1Percentage = ((performanceLevel1 / totalProfileCount) * 100).toFixed(1) };
    if (performanceLevel2 > 0) { performanceLevel2Percentage = ((performanceLevel2 / totalProfileCount) * 100).toFixed(1) };
    if (performanceLevel3 > 0) { performanceLevel3Percentage = ((performanceLevel3 / totalProfileCount) * 100).toFixed(1) };
    if (performanceLevel4 > 0) { performanceLevel4Percentage = ((performanceLevel4 / totalProfileCount) * 100).toFixed(1) };
    if (performanceLevel5 > 0) { performanceLevel5Percentage = ((performanceLevel5 / totalProfileCount) * 100).toFixed(1) };
    performanceLevelSummaryData.push(['Level', 'Sseconds', 'Total', 'Total %']);
    performanceLevelSummaryData.push(['Level 5', '> ' + PERFLEVEL5, performanceLevel5, performanceLevel5Percentage]);
    performanceLevelSummaryData.push(['Level 4', PERFLEVEL4 + ' -- ' + PERFLEVEL5, performanceLevel4, performanceLevel4Percentage]);
    performanceLevelSummaryData.push(['Level 3', PERFLEVEL3 + ' -- ' + PERFLEVEL4, performanceLevel3, performanceLevel3Percentage]);
    performanceLevelSummaryData.push(['Level 2', PERFLEVEL2 + ' -- ' + PERFLEVEL3, performanceLevel2, performanceLevel2Percentage]);
    performanceLevelSummaryData.push(['Level 1', '0 -- ' + PERFLEVEL1, performanceLevel1, performanceLevel1Percentage]);


    //
    // REPORT SORTED BY DATA INDEX
    //
    ///sort the data by data count
    personDataIndex.sort(function (a, b) {
        return b[2] - a[2];
    })

    //create percentage 
    let total = personDataIndex.length;
    var personPhotoPercent = Math.round((personPhotoCount / total) * 100) + '%';
    var personNamePercent = Math.round((personNameCount / total) * 100) + '%';
    var personTitlePercent = Math.round((personTitleCount / total) * 100) + '%';
    var personPostNominalLettersPercent = Math.round((personPostNominalLettersCount / total) * 100) + '%';
    var personResearchInterestsHeroPercent = Math.round((personResearchInterestsHeroCount / total) * 100) + '%';
    var personPhDStudentsPercent = Math.round((personPhDStudentsCount / total) * 100) + '%';
    var personEmailPercent = Math.round((personEmailCount / total) * 100) + '%';
    var personTelephonePercent = Math.round((personTelephoneCount / total) * 100) + '%';
    var personAddressPercent = Math.round((personAddressCount / total) * 100) + '%';
    var personGoogleScholarPercent = Math.round((personGoogleScholarCount / total) * 100) + '%';
    var personORCIDPercent = Math.round((personORCIDCount / total) * 100) + '%';
    var personLinkedInPercent = Math.round((personLinkedInCount / total) * 100) + '%';
    var personTwitterPercent = Math.round((personTwitterCount / total) * 100) + '%';
    var personAboutPercent = Math.round((personAboutCount / total) * 100) + '%';
    var personResearchGroupsPercent = Math.round((personResearchGroupsCount / total) * 100) + '%';
    var personResearchInterestsPercent = Math.round((personResearchInterestsCount / total) * 100) + '%';
    var personResearchCurrentPercent = Math.round((personResearchCurrentCount / total) * 100) + '%';
    var personResearchProjectsActivePercent = Math.round((personResearchProjectsActiveCount / total) * 100) + '%';
    var personResearchProjectsCompletedPercent = Math.round((personResearchProjectsCompletedCount / total) * 100) + '%';
    var personPublicationsPercent = Math.round((personPublicationsCount / total) * 100) + '%';
    var personSupervisionCurrentPercent = Math.round((personSupervisionCurrentCount / total) * 100) + '%';
    var personSupervisionPreviousPercent = Math.round((personSupervisionPreviousCount / total) * 100) + '%';
    var personTeachingIntroPercent = Math.round((personTeachingIntroCount / total) * 100) + '%';
    var personTeachingModulesPercent = Math.round((personTeachingModulesCount / total) * 100) + '%';
    var personRolesPercent = Math.round((personRolesCount / total) * 100) + '%';
    var personBiographyPercent = Math.round((personBiographyCount / total) * 100) + '%';
    var personPrizesPercent = Math.round((personPrizesCount / total) * 100) + '%';


    //add header to report
    var personDataHeader = [];
    //var totalPersonCount = personData;
    personDataHeader.push(['Person URL', 'Load time', 'Data index (26)', 'Photo', 'Name', 'Title', 'Research interests', 'Accepting PhD students', 'Email', 'Telephone', 'Address', 'Google scholar', 'ORCID', 'LinkedIn', 'Twitter', 'About', 'Research groups', 'Research interests', 'Current research', 'Research projects active', 'Research projects completed', 'Publications', 'Supervision current', 'Teaching intro', 'Teaching modules', 'Roles', 'Biography', 'Prizes', 'Person name', 'Person name suffix', '# of publications', 'Person title', 'Person email', 'Person school', 'Person faculty', 'Person school or department', 'Person username', 'Supervision quantity', 'Teaching quantity']);
    personDataHeader.push(['', totalPageLoadTime.toString(), '', personPhotoCount.toString(), personNameCount.toString(), personTitleCount.toString(), personResearchInterestsHeroCount.toString(), personPhDStudentsCount.toString(), personEmailCount.toString(), personTelephoneCount.toString(), personAddressCount.toString(), personGoogleScholarCount.toString(), personORCIDCount.toString(), personLinkedInCount.toString(), personTwitterCount.toString(), personAboutCount.toString(), personResearchGroupsCount.toString(), personResearchInterestsCount.toString(), personResearchCurrentCount.toString(), personResearchProjectsActiveCount.toString(), personResearchProjectsCompletedCount.toString(), personPublicationsCount.toString(), personSupervisionCurrentCount.toString(), personTeachingIntroCount.toString(), personTeachingModulesCount.toString(), personRolesCount.toString(), personBiographyCount.toString(), personPrizesCount.toString(), '', '', '', '', '', '', '', '', '', '', '']);
    personDataHeader.push(['', '', '', personPhotoPercent.toString(), personNamePercent.toString(), personTitlePercent.toString(), personResearchInterestsHeroPercent.toString(), personPhDStudentsPercent.toString(), personEmailPercent.toString(), personTelephonePercent.toString(), personAddressPercent.toString(), personGoogleScholarPercent.toString(), personORCIDPercent.toString(), personLinkedInPercent.toString(), personTwitterPercent.toString(), personAboutPercent.toString(), personResearchGroupsPercent.toString(), personResearchInterestsPercent.toString(), personResearchCurrentPercent.toString(), personResearchProjectsActivePercent.toString(), personResearchProjectsCompletedPercent.toString(), personPublicationsPercent.toString(), personSupervisionCurrentPercent.toString(), personTeachingIntroPercent.toString(), personTeachingModulesPercent.toString(), personRolesPercent.toString(), personBiographyPercent.toString(), personPrizesPercent.toString(), '', '', '', '', '', '', '', '', '', '', '']);
    var personDataIndex = personDataHeader.concat(personDataIndex);

    //write missing modules report
    if (personDataIndex.length > 0) {
        var csv = personDataIndex.map(function (d) {
            return d.join();
        }).join('\n');
        fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/field-progress/csv/staff-profile-field-index-' + timestamp + '.csv', csv);
    }


    //write missing modules report
    if (personDataIndex.length > 0) {
        var csv = personDataIndex.map(function (d) {
            return d.join();
        }).join('\n');
        fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/field-progress/csv/staff-profile-field-index-' + timestamp + '.csv', csv);
    }

    //setup today's data and time for the report
    var today = new Date();
    today = today.toDateString() + ' ' + today.toLocaleTimeString();

    //create html report
    var htmlReport = '';
    htmlReport += '<html><head></head><body>';
    htmlReport += '<h1>Digital UX - Staff profile data field analysis</h1>';
    //htmlReport += '<br>';
    htmlReport += '<h2>Report date : ' + today + '</h2>';
    htmlReport += '<hr>';
    htmlReport += '<h2>All staff profiles sorted by data index</h2>';
    htmlReport += '<div>A summary of each staff profile and the current completion level</div>';
    htmlReport += '<br>';
    htmlReport += htmlFunctions.generateTable(personDataIndex);
    htmlReport += '</body></html>';
    fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/field-progress/html/staff-profile-field-index-' + timestamp + '.html', htmlReport);
    fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/field-progress/html/staff-profile-field-progress.html', htmlReport);

    //
    // REPORT SORTED BY LOAD TIME
    //
    ///sort the data by data count
    personDataLoadTime.sort(function (a, b) {
        return b[1] - a[1];
    })

    //sort perofrmance data
    performanceLevel5Data.sort(function (a, b) {
        return b[1] - a[1];
    })

    performanceLevel4Data.sort(function (a, b) {
        return b[1] - a[1];
    })

    //add header to report
    personDataHeader = [];
    //var totalPersonCount = personData;
    personDataHeader.push(['Person URL', 'Load time', 'Data index (26)', 'Photo', 'Name', 'Title', 'Research interests', 'Accepting PhD students', 'Email', 'Telephone', 'Address', 'Google scholar', 'ORCID', 'LinkedIn', 'Twitter', 'About', 'Research groups', 'Research interests', 'Current research', 'Research projects active', 'Research projects completed', 'Publications', 'Supervision current', 'Teaching intro', 'Teaching modules', 'Roles', 'Biography', 'Prizes', 'Person name', 'Person name suffix', '# of publications', 'Person title', 'Person email', 'Person school', 'Person faculty', 'Person school or department', 'Person username']);
    personDataHeader.push(['', totalPageLoadTime.toString(), '', personPhotoCount.toString(), personNameCount.toString(), personTitleCount.toString(), personResearchInterestsHeroCount.toString(), personPhDStudentsCount.toString(), personEmailCount.toString(), personTelephoneCount.toString(), personAddressCount.toString(), personGoogleScholarCount.toString(), personORCIDCount.toString(), personLinkedInCount.toString(), personTwitterCount.toString(), personAboutCount.toString(), personResearchGroupsCount.toString(), personResearchInterestsCount.toString(), personResearchCurrentCount.toString(), personResearchProjectsActiveCount.toString(), personResearchProjectsCompletedCount.toString(), personPublicationsCount.toString(), personSupervisionCurrentCount.toString(), personTeachingIntroCount.toString(), personTeachingModulesCount.toString(), personRolesCount.toString(), personBiographyCount.toString(), personPrizesCount.toString(), '', '', '', '', '', '', '', '', '']);

    personDataLoadTime = personDataHeader.concat(personDataLoadTime);

    //add header to performance level data
    var performanceLevelDataHeader = [];
    performanceLevelDataHeader.push(['Person URL', 'Load time', 'Has publications?', '# of publications', 'Has project groups?', 'Has projects?']);
    performanceLevel5Data = performanceLevelDataHeader.concat(performanceLevel5Data);
    performanceLevel4Data = performanceLevelDataHeader.concat(performanceLevel4Data);



    //write missing modules report
    if (personDataLoadTime.length > 0) {
        var csv = personDataLoadTime.map(function (d) {
            return d.join();
        }).join('\n');
        fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/performance-progress/csv/staff-profile-performance-progress-' + timestamp + '.csv', csv);
    }

    //setup today's data and time for the report
    var today = new Date();
    today = today.toDateString() + ' ' + today.toLocaleTimeString();

    //create html report
    htmlReport = '';
    htmlReport += '<html><head></head><body>';
    htmlReport += '<h1>Digital UX - Staff profile page load performance analysis</h1>';
    //htmlReport += '<br>';
    htmlReport += '<h2>Report date : ' + today + '</h2>';
    htmlReport += '<hr>';
    htmlReport += '<h2>Staff profile load time summary</h2>';
    htmlReport += '<div>A breakdown of staff profile load times</div>';
    htmlReport += '<br>';
    htmlReport += htmlFunctions.generateTable(performanceLevelSummaryData);
    htmlReport += '<br>';
    htmlReport += '<h2>Staff profiles with a load time > ' + PERFLEVEL5 + ' seconds</h2>';
    htmlReport += '<div>These profiles will need further investigation and optimisation </div>';
    htmlReport += '<br>';
    htmlReport += htmlFunctions.generateTable(performanceLevel5Data);
    htmlReport += '<br>';
    htmlReport += '<h2>Staff profiles with a load time > ' + PERFLEVEL4 + ' seconds</h2>';
    htmlReport += '<div>These profiles will need further investigation and optimisation </div>';
    htmlReport += '<br>';
    htmlReport += htmlFunctions.generateTable(performanceLevel4Data);
    htmlReport += '<br>';
    htmlReport += '<h2>All staff profiles sorted by load time</h2>';
    htmlReport += '<div>A summary of each staff profile sorted by load load time</div>';
    htmlReport += '<br>';
    htmlReport += htmlFunctions.generateTable(personDataLoadTime);
    htmlReport += '</body></html>';
    fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/performance-progress/html/staff-profile-performance-progress-' + timestamp + '.html', htmlReport);
    fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/performance-progress/html/staff-profile-performance-progress.html', htmlReport);
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
siteURLS = urlGenerator.getStaffProfileURLs(argv.domain);

//run the report
runner_GenerateReport(argv.urllimit, argv.domain, argv.gebug);

