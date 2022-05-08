const fs = require('fs');
const puppeteer = require('puppeteer');
const yargs = require("yargs");
const htmlFunctions = require('../local-modules/html-functions');
const urlGenerator = require('../local-modules/site-urls');
const globalSettings = require('../local-modules/report-settings');
const { exit, title } = require('process');
const { time } = require('console');

const REPORTS_DATA_FOLDER = globalSettings.getReportsFolder();

//DATA CONST
var DATE_TODAY = globalSettings.getTimestamp('today', 'yymmdd');
var DATE_YESTERDAY = globalSettings.getTimestamp('yesterday', 'yymmdd');

STAFF_PROFILE_DATA_LATEST = REPORTS_DATA_FOLDER + 'staff-profile/field-progress/csv/staff-profile-field-index-' + DATE_TODAY + '.csv';
RESEARCH_PROJECT_DATA_LATEST = REPORTS_DATA_FOLDER + 'research-projects/field-progress/csv/research-projects-data-field-progress-' + DATE_TODAY + '.csv';


//global variables
var projectData = [];
var projectDataCSV = [];

var projectTitleData = [];
var projectDuplicateTitleCount = 0;
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
let projectTitleCount = 0;
let projectResearchAreaCount = 0;
let projectResearchGroupCount = 0;
let projectLeadResearcherCount = 0;
let projectOtherResearchersCount = 0;
let projectResearchFunderCount = 0;
let projectWebsiteCount = 0;
let projectStatusCount = 0;
let projectOverviewCount = 0;
let projectStaffLeadResearcherCount = 0;
let projectStaffOtherResearchersCount = 0;
let projectResearchOutputsCount = 0;
let projectPartnersCount = 0;




//var projectURLS = ['https://oneweb.pprd.soton.ac.uk/people/professor-sir-david-payne', 'https://oneweb.pprd.soton.ac.uk/people/professor-mark-nixon', 'https://oneweb.pprd.soton.ac.uk/people/professor-andrew-tatem', 'https://oneweb.pprd.soton.ac.uk/people/doctor-jo-nield', 'https://oneweb.pprd.soton.ac.uk/people/doctor-julian-leyland', 'https://oneweb.pprd.soton.ac.uk/people/professor-stephen-darby', 'https://oneweb.pprd.soton.ac.uk/people/professor-helen-roberts', 'https://oneweb.pprd.soton.ac.uk/people/doctor-denis-drieghe', 'https://oneweb.pprd.soton.ac.uk/people/doctor-pete-lawrence', 'https://oneweb.pprd.soton.ac.uk/people/doctor-gemma-fitzsimmons', 'https://oneweb.pprd.soton.ac.uk/people/doctor-alex-weddell', 'https://oneweb.pprd.soton.ac.uk/people/mr-paul-thwaite'];

var projectURLS = ['https://oneweb.pprd.soton.ac.uk/research/projects/centre-for-trustworthy-autonomous-systems'];

siteURLS = projectURLS;

async function generateReport(urllimit, domain, debug) {

  if (urllimit == 0) {
    urllimit = siteURLS.length
  }

  totalProfileCount = urllimit;

  console.log('');
  console.log('Generating research projects report for ' + urllimit + ' projects:');

  var browser;
  var page;
  var projectSocialMedia = [];
  var refreshPageInstanceCount = 0;
  let previousTitle = '';
  let personURLs = urlGenerator.getStaffProfileURLs(domain);




  //open the browser and use one page to get the data
  //much quicker
  try {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.setDefaultNavigationTimeout(120000);
    await page.goto('https://oneweb.soton.ac.uk');
    //await page.setViewport({ width: 1300, height: 5000 });
  } catch (error) {
    console.log('Unable to startup browser ' + error);
    process.exit();
  }



  var timeBeforeRun = new Date();

  for (let i = 0; i < urllimit; i++) {

    //count the number of data matches per profile
    var projectDataCount = 0;
    var duplicateTitle = '';
    refreshPageInstanceCount++;

    const YES = 'YES';
    const NO = 'NO';



    let projectTitleFound = NO;
    let projectResearchAreaFound = NO;
    let projectResearchGroupFound = NO;
    let projectLeadResearcherFound = NO;
    let projectOtherResearchersFound = NO;
    let projectResearchFunderFound = NO;
    let projectWebsiteFound = NO;
    let projectStatusFound = NO;
    let projectOverviewFound = NO;
    let projectStaffLeadResearcherFound = NO;
    let projectStaffOtherResearchersFound = NO;
    let projectResearchOutputsFound = NO;
    let projectPartnersFound = NO;

    //siteURLS = ['https://oneweb.pprd.soton.ac.uk/people/professor-david-richardson', 'https://oneweb.pprd.soton.ac.uk/people/professor-lajos-hanzo','https://oneweb.pprd.soton.ac.uk/people/professor-david-richardson', 'https://oneweb.pprd.soton.ac.uk/people/professor-lajos-hanzo','https://oneweb.pprd.soton.ac.uk/people/professor-david-richardson', 'https://oneweb.pprd.soton.ac.uk/people/professor-lajos-hanzo','https://oneweb.pprd.soton.ac.uk/people/professor-david-richardson', 'https://oneweb.pprd.soton.ac.uk/people/professor-lajos-hanzo'];

    //siteURLS = ['https://oneweb.pprd.soton.ac.uk/people/professor-age-chapman', 'https://oneweb.pprd.soton.ac.uk/people/mr-paul-thwaite'];

    //siteURLS = ['https://oneweb.pprd.soton.ac.uk/research/projects/centre-for-trustworthy-autonomous-systems', 'https://oneweb.pprd.soton.ac.uk/research/projects/closed-zeta-functions-of-groups-rings-igusas-local-zeta-function', 'https://oneweb.pprd.soton.ac.uk/research/projects/nucinkis-geometric-methods-in-cohomology-of-soluble-groups-their-generalisation'];


    try {

      // setup the browser and go to the test url
      //browser = await puppeteer.launch();


      var projectURL = siteURLS[i][0].toString();
      var projectTitle = siteURLS[i][1].toString();
      var projectFaculty = siteURLS[i][2].toString();
      var projectSchool = siteURLS[i][3].toString().replace(/,/g, " "); //replace commas with a space
      projectTitle = projectTitle.replace(/,/g, " ");



      //projectURL = 'https://oneweb.pprd.soton.ac.uk/people/alexander-mortensen';
      //output progress
      //console.log(i + " - " + projectURL);
      //console.log('title = ' + projectURL);
      //console.log('faculty = ' + projectFaculty);
      //console.log('school = ' + projectSchool);


      console.log(i + " - " + projectURL);

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
        await page.goto(projectURL);
        var timeAfter = new Date();
        var projectPageLoadTime = (timeAfter - timeBefore) / 1000;
        projectPageLoadTime = projectPageLoadTime.toFixed(2);

      } catch (error) {

        if (error.toString().indexOf('Navigation failed because browser has disconnected!') != -1) {
          console.log('Error detected with the browser.  Starting a new browser.');
          browser = await puppeteer.launch();
          page = await browser.newPage();
          await page.setDefaultNavigationTimeout(120000);

          var timeBefore = new Date();
          await page.goto(projectURL);
          var timeAfter = new Date();
          var projectPageLoadTime = (timeAfter - timeBefore) / 1000;
          projectPageLoadTime = projectPageLoadTime.toFixed(2);
        }

        if (error.toString().indexOf('Execution context was destroyed, most likely because of a navigation') != -1) {
          console.log('Error detected in navigation. Trying again with profile ' + projectURL);

          var timeBefore = new Date();
          await page.goto(projectURL);
          var timeAfter = new Date();
          var projectPageLoadTime = (timeAfter - timeBefore) / 1000;
          projectPageLoadTime = projectPageLoadTime.toFixed(2);
        }

        console.log(error);

      }




      //project hero
      let projectTitleValue = await page.evaluate(() => Array.from(document.querySelectorAll('#info-block > div > div > h1 > span'), element => element.textContent));

      //if title empty, the page is using a different field
      if (projectTitleValue == '') {
        projectTitleValue = await page.evaluate(() => Array.from(document.querySelectorAll('#info-block > div > div > h1 > div'), element => element.textContent));
      }

      //remove commas from project title
      projectTitleValue = projectTitleValue.toString().replace(/,/g, " ");


      let projectResearchArea = '';
      let projectResearchGroup = '';
      let projectLeadResearcher = '';
      let projectOtherResearchers = '';
      let projectResearchFunder = '';
      let projectWebsite = '';
      let projectStatus = '';
      let leadResearcherURL = '';
      let leadResearcherName = '';
      let projectStatusValue = '';
      let projectResearchFunderEPSRC = ''
      let projectResearchFunderValue = ''
      let heroChildLevel = 1;
      const projectHero = await page.$$eval('#info-block > div > div > div', divs => divs.map(({ innerText }) => innerText));
      for (let index = 0; index < projectHero.length; index++) {
        const element = projectHero[index];




        if (element.toString().indexOf('Research area') > -1) {
          projectResearchArea = element;
          heroChildLevel++;
        }

        if (element.toString().indexOf('Research group') > -1) {
          projectResearchGroup = element;
          heroChildLevel++;
        }

        if (element.toString().indexOf('Lead researcher') > -1) {
          projectLeadResearcher = element;
          let selector = '#info-block > div > div > div:nth-child(' + heroChildLevel + ') > div > a';
          leadResearcherURL = await page.evaluate((selector) => Array.from(document.querySelectorAll(selector), a => a.getAttribute('href')), selector);
          leadResearcherName = await page.evaluate((selector) => Array.from(document.querySelectorAll(selector), element => element.textContent), selector);
        }

        if (element.toString().indexOf('Other researchers') > -1) {
          projectOtherResearchers = element;
        }

        if (element.toString().indexOf('Research funder') > -1) {
          projectResearchFunderValue = element.split('Research funder:').pop().split('Status:')[0];
          projectResearchFunderValue = projectResearchFunderValue.trim();

          //console.log('Funder = ' + projectResearchFunderValue);

          projectResearchFunder = element;
        }

        if (element.toString().indexOf('Website') > -1) {
          projectWebsite = element;
        }

        if (element.toString().indexOf('Status') > -1) {
          projectStatus = element;
        }

        if (element.toString().indexOf('Active') > -1) {
          projectStatusValue = 'Active';
        }
        else {
          projectStatusValue = 'Not active';
        }

      }

      //let projectResearchFunderValue = '';
      //if (projectResearchFunder.length > 0) {
      //  let projectOverview = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > article > div > div > div > div > div:nth-child(2) > p'), element => element.textContent));
      //  #info-block > div > div.project-info.pt-8 > div:nth-child(3) > div.field-content
      // }

      //project page
      let projectOverview = await page.evaluate(() => Array.from(document.querySelectorAll('#main-content > div > article > div > div > div > div > div:nth-child(2) > p'), element => element.textContent));
      let projectStaffLeadResearcher = await page.evaluate(() => Array.from(document.querySelectorAll('#research-project-staff-block > div:nth-child(2) > div'), element => element.textContent));
      let projectStaffOtherResearchers = await page.evaluate(() => Array.from(document.querySelectorAll('#research-project-staff-block > div:nth-child(3) > div'), element => element.textContent));
      let projectResearchOutputs = await page.evaluate(() => Array.from(document.querySelectorAll('#research-project-publications-block > h2'), element => element.textContent));
      let projectPartners = await page.evaluate(() => Array.from(document.querySelectorAll('#research-project-partners-block > h2'), element => element.textContent));

      if (debug == 'true') {

        console.log('Hero');
        console.log('Title --> ' + projectTitleValue);
        console.log('Research area --> ' + projectResearchArea);
        console.log('Research groups --> ' + projectResearchGroup);
        console.log('Lead researcher --> ' + projectLeadResearcher);
        console.log('Lead researcher URL --> ' + leadResearcherURL);
        console.log('Lead researcher name --> ' + leadResearcherName);
        console.log('Other researchers --> ' + projectOtherResearchers);
        console.log('Funder --> ' + projectResearchFunder);
        console.log('Website --> ' + projectWebsite);
        console.log('Status --> ' + projectStatus);
        console.log('Page');
        console.log('Overview --> ' + projectOverview);
        console.log('Lead researcher --> ' + projectStaffLeadResearcher);
        console.log('Other researchers --> ' + projectStaffOtherResearchers);
        console.log('Reseaerch outputs --> ' + projectResearchOutputs);
        console.log('Partners --> ' + projectPartners);
        console.log('-----------------------------------------------');
      }



      if (projectTitleValue.length > 0) {
        projectTitleFound = YES;
        projectTitleCount++;
        projectDataCount++;
      }

      if (projectResearchArea.length > 0) {
        projectResearchAreaFound = YES;
        projectResearchAreaCount++;
        projectDataCount++;
      }

      if (projectResearchGroup.length > 0) {
        projectResearchGroupFound = YES;
        projectResearchGroupCount++;
        projectDataCount++;
      }

      if (projectLeadResearcher.length > 0) {
        projectLeadResearcherFound = YES;
        projectLeadResearcherCount++;
        projectDataCount++;
      }

      if (projectOtherResearchers.length > 0) {
        projectOtherResearchersFound = YES;
        projectOtherResearchersCount++;
        projectDataCount++;
      }

      if (projectResearchFunder.length > 0) {
        projectResearchFunderFound = YES;
        projectResearchFunderCount++;
        projectDataCount++;
      }

      if (projectWebsite.length > 0) {
        projectWebsiteFound = YES;
        projectWebsiteCount++;
        projectDataCount++;
      }

      if (projectStatus.length > 0) {
        projectStatusFound = YES;
        projectStatusCount++;
        projectDataCount++;
      }

      if (projectOverview.length > 0) {
        projectOverviewFound = YES;
        projectOverviewCount++;
        projectDataCount++;
      }

      if (projectStaffLeadResearcher.length > 0) {
        projectStaffLeadResearcherFound = YES;
        projectStaffLeadResearcherCount++;
        projectDataCount++;
      }
      if (projectStaffOtherResearchers.length > 0) {
        projectStaffOtherResearchersFound = YES;
        projectStaffOtherResearchersCount++;
        projectDataCount++;
      }
      if (projectResearchOutputs.length > 0) {
        projectResearchOutputsFound = YES;
        projectResearchOutputsCount++;
        projectDataCount++;
      }
      if (projectPartners.length > 0) {
        projectPartnersFound = YES;
        projectPartnersCount++;
        projectDataCount++;
      }

      if (projectDataCount == 0) {
        projectDataCount = '404!';
      }


      //find lead researcher's faculty and school
      let leadResearcherFaculty = '';
      let leadResearcherSchool = '';


      if ((projectFaculty == '') && (leadResearcherURL != '')) {
        console.log('Faculty empty');
        console.log('Lead researcher --> ' + leadResearcherURL);
        personURLs.forEach(person => {
          var personURL = person[0].toString();
          var personFaculty = person[2].toString();
          var personSchool = person[3].toString();

          personURL = personURL.slice(26);
          //console.log(leadResearcherURL + ' ---> ' + personURL);

          if (leadResearcherURL == personURL) {
            projectFaculty = personFaculty;

            if (personSchool == '') {
              projectSchool = 'School not set';
            } else {
              projectSchool = personSchool;
            }

            console.log('==> faculty not found, using this from lead researcher ===> ' + projectFaculty + ' - ' + projectSchool);

            //mark the lead researcher name with an * to indicate their faculty and school was derived differently
            leadResearcherName += '<sup>*</sup>';
          }
        });
      }

      //create lead researcher url
      let projectLeadResearcherURL = '<a href="' + 'https://oneweb.soton.ac.uk/' + leadResearcherURL + '" target="_blank"> ' + leadResearcherName + '</a';
      let projectTitleURL = '<a href="' + projectURL + '" target="_blank"> ' + projectTitleValue + '</a>';

      if (projectDataCount != 0) {
        //projectDataCount = '404!';
        projectData.push([projectTitleURL, projectStatusValue, projectResearchFunderValue, projectLeadResearcherURL, projectFaculty, projectSchool, projectPageLoadTime.toString(), projectDataCount.toString(), projectTitleFound, projectResearchAreaFound, projectResearchGroupFound, projectLeadResearcherFound, projectOtherResearchersFound, projectResearchFunderFound, projectWebsiteFound, projectStatusFound, projectOverviewFound, projectStaffLeadResearcherFound, projectStaffOtherResearchersFound, projectResearchOutputsFound, projectPartnersFound]);

        projectDataCSV.push([projectTitleURL, projectTitleValue, projectStatusValue, projectResearchFunderValue, projectLeadResearcherURL, leadResearcherName, projectFaculty, projectSchool, projectPageLoadTime.toString(), projectDataCount.toString(), projectTitleFound, projectResearchAreaFound, projectResearchGroupFound, projectLeadResearcherFound, projectOtherResearchersFound, projectResearchFunderFound, projectWebsiteFound, projectStatusFound, projectOverviewFound, projectStaffLeadResearcherFound, projectStaffOtherResearchersFound, projectResearchOutputsFound, projectPartnersFound]);
      }

      if (projectTitleValue.toString() === previousTitle.toString()) {
        duplicateTitle = 'YES';
        projectDuplicateTitleCount++;
      }

      var projectLead = projectLeadResearcher.split(':');
      if (projectLead.length > 1) {
        projectLead = projectLead[1].slice(1);
      }
      projectTitleData.push([projectURL, projectTitleValue, projectLead, duplicateTitle]);
      previousTitle = projectTitleValue;

      //add the url as the title for performance data to capture the projects which timeout (page load > 60 seconds)
      if (projectTitleValue == '') {
        projectTitleValue = projectURL;
      }

      //
      //allocate performance level
      //
      if (projectPageLoadTime < PERFLEVEL1) {
        performanceLevel1++;
        performanceLevel1Data.push([projectURL, projectPageLoadTime, projectTitleValue]);
      }
      if ((projectPageLoadTime >= PERFLEVEL1) && (projectPageLoadTime < PERFLEVEL3)) {
        performanceLevel2++;
        performanceLevel2Data.push([projectURL, projectPageLoadTime, projectTitleValue]);
      }
      if ((projectPageLoadTime >= PERFLEVEL3) && (projectPageLoadTime < PERFLEVEL4)) {
        performanceLevel3++;
        performanceLevel3Data.push([projectURL, projectPageLoadTime, projectTitleValue]);
      }
      if ((projectPageLoadTime >= PERFLEVEL4) && (projectPageLoadTime < PERFLEVEL5)) {
        performanceLevel4++;
        performanceLevel4Data.push([projectURL, projectPageLoadTime, projectTitleValue]);
      }
      if (projectPageLoadTime >= PERFLEVEL5) {
        performanceLevel5++;
        performanceLevel5Data.push([projectURL, projectPageLoadTime, projectTitleValue]);
      }



    } catch (err) {

      console.log('Problem detected with ' + projectURL);
      console.log(err);
      //await page.close();
      //page = await browser.newPage();
    };
  }

  var timeAfterRun = new Date();
  totalPageLoadTime = (timeAfterRun - timeBeforeRun) / 1000;
  totalPageLoadTime = totalPageLoadTime.toFixed(2);

  await browser.close();
}



function createBarChart(data) {

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

    for (let column = 6; column < 29; column++) {
      const theColumn = data[row][column];

      if (theColumn == 'YES') {
        chartDataYes[column - 6]++;
      } else {
        chartDataNo[column - 6]++;
      }
    }
  }

  console.log(chartDataYes);
  console.log(chartDataNo);

  let LABELS = "['Title', 'Research area (CMS)', 'Research groups (CMS)', 'Lead researcher', 'Other researches', 'Research funder', 'Research website', 'Research status', 'Research overview', 'Research lead researcher', 'Research other researchers', 'Research outputs', 'Research partners (CMS)']";

  const TOTAL = data.length;
  const TITLE = "RESEARCH PROJECTS PROGRESS";

  let graphHTML = ` 
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
                label: 'DATA FIELD COMPLETED',
                data: [${chartDataYes}],
                backgroundColor: CHART_COLORS.blue,
              },
              //{
              //  label: 'DATA FIELD EMPTY',
              //  data: [${chartDataNo}],
              //  backgroundColor: CHART_COLORS.red,
              //},
            ]
          };
      
          var myChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
              plugins: {
                title: {
                  display: true,
                  text: '${TITLE}',
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
                    text: 'Data fields completed across all research projects',
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
                  title: {
                    display: true,
                    text: 'Data fields on staff profile'
                  },
                },
                y: {
                  stacked: true,
                  title: {
                    display: true,
                    text: 'Staff profiles containing data'
                  }
                }
              }
            }
          })
        </script>`

  return graphHTML;
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

    for (let column = 4; column < 29; column++) {
      const theColumn = data[row][column];

      if (theColumn == 'YES') {
        chartDataYes[column - 4]++;
      } else {
        chartDataNo[column - 4]++;
      }
    }
  }

  console.log(chartDataYes);
  console.log(chartDataNo);

  let LABELS = "['Title', 'Research area (CMS)', 'Research groups (CMS)', 'Lead researcher', 'Other researches', 'Research funder', 'Research website', 'Research status', 'Research overview', 'Research lead researcher', 'Research other researchers', 'Research outputs', 'Research partners (CMS)']";

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
                text: 'Research project field anaylsis'
              },
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

  fs.writeFileSync(REPORTS_DATA_FOLDER + 'research-projects/field-progress/graph/research-projects-field-progress-graph-' + timestamp + '.html', htmlDocument);


}


async function createStackedGroupedChart(domain, data) {

  var projectPhotoIndex = 3;
  var projectNameIndex = 4;
  var projectTitleIndex = 5;
  var projectPostNominalLettersIndex = 0;
  var projectResearchInterestsHeroIndex = 6;
  var projectPhDStudentsIndex = 7;
  var projectEmailIndex = 8;
  var projectTelephoneIndex = 9;
  var projectAddressIndex = 10;
  var projectGoogleScholarIndex = 11;
  var projectORCIDIndex = 12;
  var projectLinkedInIndex = 13;
  var projectTwitterIndex = 14;
  var projectAboutIndex = 15;
  var projectResearchGroupsIndex = 16;
  var projectResearchInterestsIndex = 17;
  var projectResearchCurrentIndex = 18;
  var projectResearchProjectsActiveIndex = 19;
  var projectResearchProjectsCompletedIndex = 20;
  var projectPublicationsIndex = 21;
  var projectSupervisionCurrentIndex = 22;
  var projectSupervisionPreviousIndex = 23;
  var projectTeachingIntroIndex = 24;
  var projectTeachingModulesIndex = 25;
  var projectRolesIndex = 26;
  var projectBiographyIndex = 28;
  var projectPrizesIndex = 29;


  let chartDataYes = [];
  let chartDataNo = [];

  let chartDataHeroYes = [];
  let chartDataHeroNo = [];

  let chartDataAboutYes = [];
  let chartDataAboutNo = [];

  let chartDataResearchYes = [];
  let chartDataResearchNo = [];

  let chartDataPublicationsYes = [];
  let chartDataPublicationsNo = [];

  let chartDataSupervisionYes = [];
  let chartDataSupervisionNo = [];

  let chartDataTeachingYes = [];
  let chartDataTeachingNo = [];

  let chartDataRolesYes = [];
  let chartDataRolesNo = [];

  let chartDataBiographyYes = [];
  let chartDataBiographyNo = [];

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

  let LABELS = "['Photo', 'Name', 'Title', 'Research interests', 'Accepting PhD students', 'Email', 'Telephone', 'Address', 'Google scholar', 'ORCID', 'LinkedIn', 'Twitter', 'About', 'Research groups', 'Research interests', 'Current research', 'Research projects active', 'Research projects completed', 'Publications', 'Supervision current', 'Supervision previous', 'Teaching intro', 'Teaching modules', 'Roles', 'Biography', 'Prizes']";

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
              label: 'YES',
              data: [${chartDataYes[3]}],
              backgroundColor: CHART_COLORS.green,
              stack: 'Hero',
            },
            {
              label: 'NO',
              data: [${chartDataNo[3]}],
              backgroundColor: CHART_COLORS.red,
              stack: 'Hero',
            },
            {
                label: 'YES',
                data: [${chartDataYes[4]}],
                backgroundColor: CHART_COLORS.green,
                stack: 'Hero',
              },
              {
                label: 'NO',
                data: [${chartDataNo[4]}],
                backgroundColor: CHART_COLORS.red,
                stack: 'Hero',
              },
            {
              label: 'YES',
              data: [${chartDataYes[5]}],
              backgroundColor: CHART_COLORS.green,
              stack: 'About',
            },
            {
              label: 'NO',
              data: [${chartDataNo[5]}],
              backgroundColor: CHART_COLORS.red,
              stack: 'About',
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
                text: 'Chart.js Bar Chart - Stacked'
              },
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

  fs.writeFileSync('../reports/html/staff-profile-graphs-stacked-bar-' + domain + '.html', htmlDocument);


}






async function runner_GenerateReport(urllimit, domain, debug) {

  //fetch the data
  await generateReport(urllimit, domain, debug);

  //create report by faculty
  // await generateReportByFaculty(projectData);

  //count the data for charts
  //var PHOTO_DATA = await countData(1);
  await createStackedChart(domain, projectData);
  //await createStackedGroupedChart(domain, projectData);


  //create the data charts


  //fetch the date
  var timestamp = globalSettings.getTimestamp('today', 'yymmdd');

  //make two copies of the projectArray
  var projectDataIndex = projectData.map(function (arr) {
    return arr.slice();
  });

  //make two copies of the projectArray
  var projectDataLoadTime = projectData.map(function (arr) {
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
  projectDataCSV.sort(function (a, b) {
    return b[8] - a[8];
  })

  //add header to report
  var projectDataHeader = [];
  //var totalprojectCount = projectData;


  //write missing modules report
  if (projectDataCSV.length > 0) {
    var csv = projectDataCSV.map(function (d) {
      return d.join();
    }).join('\n');
    fs.writeFileSync(REPORTS_DATA_FOLDER + 'research-projects/field-progress/csv/research-projects-data-field-progress-' + timestamp + '.csv', csv);
  }

  //setup today's data and time for the report
  var today = new Date();
  today = today.toDateString() + ' ' + today.toLocaleTimeString();

  var timestamp = globalSettings.getTimestamp('today', 'yymmdd');




  let chartDataYes = [];
  let chartDataNo = [];

  for (let index = 0; index < 29; index++) {
    chartDataYes[index] = 0;
    chartDataNo[index] = 0;
  }

  let reportData = projectData;

  ///sort the data by data count
  reportData.sort(function (a, b) {
    return b[6] - a[6];
  })

  let acttveProjectsOnly = [];
  let filterActiveProjectsOnly = false;
  if (filterActiveProjectsOnly) {

    projectData.forEach(project => {

      let status = project[5];
      console.log(status);

      if (status.toString() == 'Active') {
        acttveProjectsOnly.push(project);
        console.log('&');
      }
    });

    reportData = acttveProjectsOnly;
  }

  projectDataHeader.push(['Project title', 'Status', 'Funder', 'Lead researcher name', 'Faculty', 'School', 'Load time', 'Data index (26)', 'Title', 'Research area', 'Research groups', 'Lead researcher', 'Other researches', 'Research funder', 'Research website', 'Research status', 'Research overview', 'Research lead researcher', 'Research other researchers', 'Research outputs', 'Research partners']);
  projectDataHeader.push(['', '', '', '', '', '', '', totalPageLoadTime.toString(), projectTitleCount.toString(), projectResearchAreaCount.toString(), projectResearchGroupCount.toString(), projectLeadResearcherCount.toString(), projectOtherResearchersCount.toString(), projectResearchFunderCount.toString(), projectWebsiteCount.toString(), projectStatusCount.toString(), projectOverviewCount.toString(), projectStaffLeadResearcherCount.toString(), projectStaffOtherResearchersCount.toString(), projectResearchOutputsCount.toString(), projectPartnersCount.toString()]);
  var projectDataFinal = projectDataHeader.concat(reportData);

  console.log('s = ' + reportData.length);

  for (let row = 0; row < projectDataFinal.length; row++) {
    const theRow = projectDataFinal[row];

    for (let column = 6; column < 29; column++) {
      const theColumn = projectDataFinal[row][column];

      if (theColumn == 'YES') {
        chartDataYes[column - 6]++;
      } else {
        chartDataNo[column - 6]++;
      }
    }
  }

  console.log(chartDataYes);
  console.log(chartDataNo);

  let LABELS = "['Title', 'Research area (CMS)', 'Research groups (CMS)', 'Lead researcher', 'Other researches', 'Research funder', 'Research website', 'Research status', 'Research overview', 'Research lead researcher', 'Research other researchers', 'Research outputs', 'Research partners (CMS)']";


  //create html report
  var htmlReport = '';
  htmlReport += '<html><head>';
  htmlReport += `<style>
            table,
            th,
            td {
                border: 1px solid black;
                border-collapse: collapse;
                border-color: #808080;
            }
  
            table {
                width: 130%;
            }

            table.fixed {
                table-layout: fixed;
            }
  
            td:nth-child(1) {
                width: 12%;
            }
  
        </style>
        
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Staff profile data field analysis</title>
      <!--Chart.js JS CDN-->
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`;

  htmlReport += '</head><body>';
  htmlReport += '<h1>Digital UX - Research projects data field analysis</h1>';
  //htmlReport += '<br>';
  htmlReport += '<div>Report date : ' + today + '</div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>Summary of research project field completion</h2>';
  htmlReport += '<div>A summary of each research project and the current completion level</div>';
  htmlReport += '<div><canvas id="myChart" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas></div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>All research projects sorted by data index</h2>';
  htmlReport += '<div>A summary of each research project and the current completion level</div>';
  htmlReport += '<br>';
  //htmlReport += htmlFunctions.generateTable(projectDataIndex);
  htmlReport += htmlFunctions.generateTable(projectDataFinal);
  htmlReport += '<br>';
  htmlReport += '<br>';
  htmlReport += createBarChart(projectDataFinal);
  htmlReport += '</body></html>';
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'research-projects/field-progress/html/research-projects-field-progress-' + timestamp + '.html', htmlReport);
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'research-projects/field-progress/html/research-projects-field-progress.html', htmlReport);

  //
  // REPORT SORTED BY LOAD TIME
  //
  ///sort the data by data count
  projectDataLoadTime.sort(function (a, b) {
    return b[5] - a[5];
  })

  //sort perofrmance data
  performanceLevel5Data.sort(function (a, b) {
    return b[1] - a[1];
  })

  performanceLevel4Data.sort(function (a, b) {
    return b[1] - a[1];
  })

  //add header to report
  projectDataHeader = [];
  //var totalprojectCount = projectData;
  projectDataHeader.push(['Project title', 'Status', 'Funder', 'Lead researcher name', 'Faculty', 'School', 'Load time', 'Data index (26)', 'Title', 'Research area', 'Research groups', 'Lead researcher', 'Other researches', 'Research funder', 'Research website', 'Research status', 'Research overview', 'Research lead researcher', 'Research other researchers', 'Research outputs', 'Research partners']);
  projectDataHeader.push(['', '', '', '', '', '', '', totalPageLoadTime.toString(), projectTitleCount.toString(), projectResearchAreaCount.toString(), projectResearchGroupCount.toString(), projectLeadResearcherCount.toString(), projectOtherResearchersCount.toString(), projectResearchFunderCount.toString(), projectWebsiteCount.toString(), projectStatusCount.toString(), projectOverviewCount.toString(), projectStaffLeadResearcherCount.toString(), projectStaffOtherResearchersCount.toString(), projectResearchOutputsCount.toString(), projectPartnersCount.toString()]);

  projectDataLoadTime = projectDataHeader.concat(projectDataLoadTime);

  //add header to performance level data
  var performanceLevelDataHeader = [];
  performanceLevelDataHeader.push(['project URL', 'Load time', 'Project title']);
  performanceLevel5Data = performanceLevelDataHeader.concat(performanceLevel5Data);
  performanceLevel4Data = performanceLevelDataHeader.concat(performanceLevel4Data);



  //write missing modules report
  if (projectDataLoadTime.length > 0) {
    var csv = projectDataLoadTime.map(function (d) {
      return d.join();
    }).join('\n');
    fs.writeFileSync(REPORTS_DATA_FOLDER + 'research-projects/field-progress/html/research-projects-field-index-' + timestamp + '.csv', csv);
  }

  //setup today's data and time for the report
  var today = new Date();
  today = today.toDateString() + ' ' + today.toLocaleTimeString();

  //create html report
  htmlReport = '';
  htmlReport += '<html><head></head><body>';
  htmlReport += '<h1>Digital UX - Research project page load performance analysis</h1>';
  //htmlReport += '<br>';
  htmlReport += '<h2>Report date : ' + today + '</h2>';
  htmlReport += '<hr>';
  htmlReport += '<h2>Research project load time summary</h2>';
  htmlReport += '<div>A breakdown of research project load times</div>';
  htmlReport += '<br>';
  htmlReport += htmlFunctions.generateTable(performanceLevelSummaryData);
  htmlReport += '<br>';
  htmlReport += '<h2>Research project with a load time > ' + PERFLEVEL5 + ' seconds</h2>';
  htmlReport += '<div>These projects will need further investigation and optimisation </div>';
  htmlReport += '<br>';
  htmlReport += htmlFunctions.generateTable(performanceLevel5Data);
  htmlReport += '<br>';
  htmlReport += '<h2>Research project with a load time > ' + PERFLEVEL4 + ' seconds</h2>';
  htmlReport += '<div>These projects will need further investigation and optimisation </div>';
  htmlReport += '<br>';
  htmlReport += htmlFunctions.generateTable(performanceLevel4Data);
  htmlReport += '<br>';
  htmlReport += '<h2>All Research project sorted by load time</h2>';
  htmlReport += '<div>A summary of each Research project sorted by load load time</div>';
  htmlReport += '<br>';
  htmlReport += htmlFunctions.generateTable(projectDataLoadTime);
  htmlReport += '<br>';
  htmlReport += '<br>';
  htmlReport += '</body></html>';
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'research-projects/performance-progress/html/research-projects-performance-progress-' + timestamp + '.html', htmlReport);
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'research-projects/performance-progress/html/research-projects-performance-progress.html', htmlReport);


  var projectTitleDataHeader = [];
  projectTitleDataHeader.push(['Project URL', 'Project title', 'Lead researcher', 'Project title duplicate?']);
  projectTitleData = projectTitleDataHeader.concat(projectTitleData);

  //create html report
  var htmlReport = '';
  htmlReport += '<html><head></head><body>';
  htmlReport += '<h1>Digital UX - Research project title field analysis</h1>';
  htmlReport += '<h2>Report date : ' + today + '</h2>';
  htmlReport += '<hr>';
  htmlReport += '<h2>All research projects sorted by project title</h2>';
  htmlReport += '<div>A summary of each research project including URL, title and whether the title has a duplicate project</div>';
  htmlReport += '<ul><li> There are ' + projectDuplicateTitleCount + ' projects with duplicate titles</ul>';
  htmlReport += '<br>';
  htmlReport += htmlFunctions.generateTable(projectTitleData);
  htmlReport += '<br>';
  htmlReport += '<br>';
  htmlReport += '</body></html>';
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'research-projects/duplicate-projects/html/research-projects-duplicate-projects-' + timestamp + '.html', htmlReport);
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'research-projects/duplicate-projects/html/research-projects-duplicate-projects.html', htmlReport);
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
siteURLS = urlGenerator.getResearchProjectURLs(argv.domain);

//run the report
runner_GenerateReport(argv.urllimit, argv.domain, argv.gebug);

