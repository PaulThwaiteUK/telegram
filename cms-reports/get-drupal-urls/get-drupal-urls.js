const fs = require('fs');
const { domain, off } = require('process');
const yargs = require("yargs");
const fetch = require('node-fetch');
const htmlTable = require('../local-modules/html-functions.js');
const drupalDomains = require('../local-modules/drupal-domains.js');
const globalSettings = require('../local-modules/report-settings');

const REPORTS_DATA_FOLDER = globalSettings.getReportsFolder();

var json_data = [];
var drupalURLs = [];
var dataTypes = [];
var latestSize = 100;
var regressionTestURLs = [];
var contentTypes = [];
var contenTypesCount = [];
var personContentType = [];
var projectContentType = [];
var contentTypeList = [];
var coursePagesPGTURLs = [];
var coursePagesUGURLs = [];
var jsonDataDuplicates = [];




// this function returns URLs for section of the json blob
//it is messy and it works
async function getAllUrls(urls) {
    try {
        var data = await Promise.all(
            urls.map(
                url =>
                    fetch(url).then(
                        (response) => response.json()
                    )));

        latestSize = data[0].length;
        json_data = json_data.concat(data);

    } catch (error) {
        console.log(error)
        throw (error)
    }
}

async function fetchDrupalContentTypes(domainURL, domain) {

    var drupalFeedURL = [];
    var drupalFeedData = [];

    //we do not know how big the drupal blob is let's 
    //set a huge number of Drupal nodes / URLs
    var target = 100000;
    var latestSize;

    console.log('Downloading Drupal nodes from the ' + domainURL + ' server');
    console.log('Offset ');

    //fetch the data at 100 URLs at a time
    for (let offset = 0; offset < target; offset += 100) {

        console.log(' - ' + offset);
        var drupalFeedURL = []
        drupalFeedURL.push(domainURL + '/api/pages?_format=hal_json&items_per_page=100&offset=' + offset);

        //if latestSize is less than 100 then we have reached the end of the json stream
        //not brilliant but it works fine
        if (latestSize < 100) {
            offset = target;
        }
        else {
            try {
                var data = await Promise.all(
                    drupalFeedURL.map(
                        url =>
                            fetch(url).then(
                                (response) => response.json()
                            )));

                latestSize = data[0].length;
                drupalFeedData = drupalFeedData.concat(data);

            } catch (error) {
                console.log(error)
                throw (error)
            }
        }
    }

    const jsonData = JSON.stringify(drupalFeedData, null, 3);
    fs.writeFileSync('../url-lists/drupal-nodes-' + domain + '.json', jsonData);

    return drupalFeedData;
}

async function createStaffProfileURLFile(drupalFeedData, domain) {

    var staffProfileURLs = [];

    for (let index = 0; index < drupalFeedData.length; index++) {
        const element = drupalFeedData[index];

        for (let x = 0; x < element.length; x++) {

            //get the URL to the node and replace / with -
            var urlname = drupalFeedData[index][x].view_node.replace(/\//g, "-");

            //store the node URL
            testurl = drupalFeedData[index][x].view_node;

            //get the conten type
            var pagetype = drupalFeedData[index][x].type;

            if (pagetype == 'Person') {
                staffProfileURLs.push([testurl]);
            }
        }
    }

    //write a txt file for regression testing
    staffProfileURLs.sort();
    const reportString = JSON.stringify(staffProfileURLs, null, 3);
    fs.writeFileSync('../url-lists/person-urls-' + domain + '.json', reportString);
    fs.writeFileSync('../url-lists/person-urls-' + domain + '.txt', staffProfileURLs.toString());

    //write person content type URLs to a file
    //this is used for staff profile testing
    var csvMODULE;
    if (staffProfileURLs.length > 0) {
        var csvMODULE = personContentType.map(function (d) {
            return d.join();
        }).join('\n');

        //console.log(csvMODULE);
        fs.writeFileSync('../url-lists/staff-profile-urls-' + domain + '.csv', csvMODULE);
    }
}

async function createBackstopJSURLFile(drupalFeedData, domain) {

    var visualRegressionTestURLs = [];
    var widerRegressionTestURLs = [];

    for (let index = 0; index < drupalFeedData.length; index++) {
        const element = drupalFeedData[index];

        for (let x = 0; x < element.length; x++) {

            var jsonObj = {};

            //get the URL to the node and replace / with -
            var urlname = drupalFeedData[index][x].view_node.replace(/\//g, "-");

            //create a testname for visual regression
            var testname = drupalFeedData[index][x].type.replace(/\s/g, "-");

            //get the conten type
            var pagetype = drupalFeedData[index][x].type;

            //create the testname for visual regressoon
            testname = testname + urlname;
            testname = testname.toLowerCase();

            //store the node URL
            testurl = drupalFeedData[index][x].view_node;

            //add the testname, url, and title to an object to be used to create json
            jsonObj.testname = testname;
            jsonObj.url = drupalFeedData[index][x].view_node;
            jsonObj.title = drupalFeedData[index][x].title;

            //filter on content type to test
            //we do not want to test
            // - person
            // - CRUMS data
            /*
            if ((pagetype == 'Article') || (pagetype == 'Basic page') || (pagetype == 'Campaign') || (pagetype == 'Campus') || (pagetype == 'City') || (pagetype == 'Event') || (pagetype == 'Filter Listing') || (pagetype == 'Hall')
                || (pagetype == 'Paginated Listing') || (pagetype == 'Primary Index Page') || (pagetype == 'Secondary Index Page') || (pagetype == 'VOD_Itinerary')) {

                    visualRegressionTestURLs.push([testname, testurl]);
                //testForErrors.push([testurl]);
            }
            */

            //visual regression
            if ((pagetype != 'Person') && (pagetype != 'Crums Module Data') && (pagetype != 'UG Course') && (pagetype != 'PGT Course') && (pagetype != 'Research project')) {

                visualRegressionTestURLs.push([testname, testurl]);
            }

            //check for page errors - get more URLs
            if ((pagetype != 'Person') && (pagetype != 'Crums Module Data') && (pagetype != 'Research project')) {

                widerRegressionTestURLs.push([testurl]);
            }


        }



    }

    //
    // visual regressioon tests need to test
    // - a module
    // - a UG course page
    // - a PGT course page 
    // add these manually because we don't want to test all UG, PGT and MODULE pages
    //
    visualRegressionTestURLs.push(['hall-student-life-accommodation-halls', '/student-life/accommodation/halls']);
    visualRegressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc']);
    visualRegressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#entry']);
    visualRegressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#structure']);
    visualRegressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#modules']);
    visualRegressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#learning']);
    visualRegressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#careers']);
    visualRegressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#fees']);
    visualRegressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#apply']);
    visualRegressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#related']);
    visualRegressionTestURLs.push(['crums-module-data', '/courses/modules/mang1014']);
    visualRegressionTestURLs.push(['crums-module-data', '/courses/modules/mang1014#aims']);
    visualRegressionTestURLs.push(['crums-module-data', '/courses/modules/mang1014#syllabus']);
    visualRegressionTestURLs.push(['crums-module-data', '/courses/modules/mang1014#learning']);
    visualRegressionTestURLs.push(['crums-module-data', '/courses/modules/mang1014#assessment']);

    //write a txt file for regression testing
    visualRegressionTestURLs.sort();
    var reportString = JSON.stringify(visualRegressionTestURLs, null, 3);
    fs.writeFileSync('../url-lists/visual-regression-urls-' + domain + '.json', reportString);
    fs.writeFileSync('../url-lists/visual-regression-urls-' + domain + '.txt', visualRegressionTestURLs.toString());

    widerRegressionTestURLs.sort();
    reportString = JSON.stringify(widerRegressionTestURLs, null, 3);
    fs.writeFileSync('../url-lists/wider-regression-urls-' + domain + '.json', reportString);
    fs.writeFileSync('../url-lists/wider-regression-urls-' + domain + '.txt', widerRegressionTestURLs.toString());
}


async function createCoursePageURLFile(drupalFeedData, domain) {

    var coursePagesPGTURLs = [];
    var coursePagesUGURLs = [];

    for (let index = 0; index < drupalFeedData.length; index++) {
        const element = drupalFeedData[index];

        for (let x = 0; x < element.length; x++) {

            //get the conten type
            var pagetype = drupalFeedData[index][x].type;
            var testurl = json_data[index][x].view_node;

            //
            //store UG and PGT page types to an array
            //used for education reports
            //
            if (pagetype == 'UG Course') {
                coursePagesUGURLs.push(['UG', testurl]);
            }

            if (pagetype == 'PGT Course') {
                coursePagesPGTURLs.push(['PGT', testurl]);
            }
        }
    }

    var coursePagesURLs = [];
    coursePagesURLs = coursePagesUGURLs.concat(coursePagesPGTURLs);
    var coursePagesURLsString = JSON.stringify(coursePagesURLs, null, 3);
    fs.writeFileSync('../url-lists/course-page-urls-' + domain + '.json', coursePagesURLsString);
    fs.writeFileSync('../url-lists/course-page-urls-' + domain + '.txt', coursePagesURLs.toString());
}



async function getAllDrupalURLs(domainURL, domain) {

    //we do not know how big the drupal blob is let's 
    //set a huge number of Drupal nodes / URLs
    var target = 100000;
    var allDrupalContentTypeULRS = [];
    var allDrupalContentTypeULRS_report = [];
    var listContentTypes = [];


    console.log('Downloading Drupal nodes from the ' + domainURL + ' server');
    console.log('Offset ');

    //fetch the data at 100 URLs at a time
    for (let offset = 0; offset < target; offset += 100) {

        var urls = [];
        urls.push(domainURL + '/api/pages?_format=hal_json&items_per_page=100&offset=' + offset);

        //if latestSize is less than 100 then we have reached the end of the json stream
        //not brilliant but it works fine
        if (latestSize < 100) {
            offset = target;
        }
        else {
            await getAllUrls(urls);
            console.log('--' + latestSize + ' ' + urls);
        }
    }

    //parse the json data into an array
    //each node contains 
    //   - content type
    //   - view mode
    //   - title 

    var blah = JSON.stringify(json_data, null, 3);
    fs.writeFileSync('../url-lists/drupal-nodes-data-' + domain + '.json', blah);

    var previousContentType = '';

    //console.log('len = ' + json_data.length);

    for (let index = 0; index < json_data.length; index++) {
        const element = json_data[index];

        for (let x = 0; x < element.length; x++) {

            //get the data
            var title = json_data[index][x].title;
            var pageURL = json_data[index][x].view_node;
            var contentType = json_data[index][x].type;

            //add url to an array for duplicate analysis
            jsonDataDuplicates.push([pageURL.toString()]);

            //add content type to an array, we will filter later
            listContentTypes.push(contentType);

            //add the testname, url, and title to an object to be used to create json
            var jsonObj = {};
            jsonObj.title = title;
            jsonObj.page_url = pageURL;
            jsonObj.content_type = contentType;

            //add jsonobj type info to an array for writing to files
            if (allDrupalContentTypeULRS[contentType] == undefined) {
                allDrupalContentTypeULRS[contentType] = [];
                allDrupalContentTypeULRS_report[contentType] = [];
            }

            //allDrupalContentTypeULRS[contentType].push(jsonObj);
            allDrupalContentTypeULRS[contentType].push([pageURL]);
            allDrupalContentTypeULRS_report[contentType].push([contentType, 'https://oneweb.soton.ac.uk' + pageURL, title]);
        }
    }

    //
    // update the console with a sorted list of unique content types
    //console.log('Total published content types (nodes) on prod = ' + drupalURLs.length);
    var uniqueListContentTypes = [...new Set(listContentTypes)];
    uniqueListContentTypes.sort();
    var uniqueListContentTypesCount = [];
    //uniqueListContentTypes.sort();
    //uniqueListContentTypes.forEach(type => {
    //    console.log('- ' + type + '(' + uniqueListContentTypesCount[type] + ']');
    //    count = uniqueListContentTypesCount[type].toString();
    //    uniqueListContentTypesCount.push([type, count]);
    //});


    //
    //write URLs to a file
    //

    //
    //person
    //
    var personData = allDrupalContentTypeULRS['Person'];
    console.log(personData.length);
    personData.sort();

    //var reportString = JSON.stringify(personData, null, 3);
    //fs.writeFileSync('../url-lists/person-urls-' + domain + '.json', reportString);
    //fs.writeFileSync('../url-lists/person-urls-' + domain + '.txt', personContentType.toString());

    //
    //research projects
    //
    var researchProjectData = allDrupalContentTypeULRS['Research Project'];
    console.log(personData.length);
    researchProjectData.sort();
    reportString = JSON.stringify(researchProjectData, null, 3);
    //fs.writeFileSync('../url-lists/research-project-urls-' + domain + '.json', reportString);
    //fs.writeFileSync('../url-lists/research-project-urls-' + domain + '.txt', researchProjectData.toString());

    //
    //research groups
    //
    var researchGroupData = allDrupalContentTypeULRS['Research Group'];
    console.log(personData.length);
    researchGroupData.sort();
    reportString = JSON.stringify(researchGroupData, null, 3);
    fs.writeFileSync('../url-lists/research-group-urls-' + domain + '.json', reportString);
    fs.writeFileSync('../url-lists/research-group-urls-' + domain + '.txt', researchGroupData.toString());


    var coursePagesURLs = [];
    coursePagesURLs = coursePagesUGURLs.concat(coursePagesPGTURLs);
    var coursePagesURLsString = JSON.stringify(coursePagesURLs, null, 3);
    fs.writeFileSync('../url-lists/course-page-urls-' + domain + '.json', coursePagesURLsString);
    fs.writeFileSync('../url-lists/course-page-urls-' + domain + '.txt', coursePagesURLs.toString());

    
    //write html table for list of all content types and urls
    var today = new Date();
    today = today.toDateString() + ' ' + today.toLocaleTimeString();
    var htmlReport = '';
    contentTypeList.sort();
    htmlReport += '<html><head></head><body>';
    htmlReport += '<div id="jumptotop"</div>';
    htmlReport += '<h1>Digital UX - Drupal pages by content type on the production server</h1>';
    //htmlReport += '<br>';
    htmlReport += '<div>Report date : ' + today + '</div>';
    htmlReport += '<hr>';
    //htmlReport += htmlTable.generateTable(uniqueContentTypesCount);
    htmlReport += '<h2>Published pages by content type</h2>';
    htmlReport += '<div id="jumptotop"</div>';
    htmlReport += '<div>Jump to content type:</div>';
    htmlReport += '<br>';
    var position = 0;
    numberContentTypes = uniqueListContentTypes.length;
    uniqueListContentTypes.forEach(contentType => {
  
      var contentTypeText = contentType.replace(/\s/g, "-");
      var count = allDrupalContentTypeULRS_report[contentType].length;;
      htmlReport += '<a href="#' + contentTypeText + '">' + contentType + ' (' + count + ')</a>';

      if (position < numberContentTypes - 1) {
        htmlReport += '&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;';
      }
      position++;
    })

    uniqueListContentTypes.forEach(contentType => {

        var data = allDrupalContentTypeULRS_report[contentType];
        //console.log(data);
        data.sort(function (a, b) {
            return b[1] - a[1];
        })
        data.unshift(['Content type', 'URL', 'Title']);

        if (contentType == 'Research area') {
            console.log(data);
        }

        var count = data.length-1;
        var contentTypeText = contentType.replace(/\s/g, "-");
        htmlReport += '<h3 id=' + contentTypeText + '>' + contentType + ' (' + count + ')</h3>';
        htmlReport += '<div><a href="#jumptotop">Jump to top</a></div>';
        htmlReport += '<br>';
        //htmlReport += '<br>';
        htmlReport += htmlTable.generateTable(data);
        htmlReport += '<br>';
    });

    htmlReport += '<br>'
    htmlReport += '</body></html>';
    fs.writeFileSync(REPORTS_DATA_FOLDER + 'drupal/content-types/html/drupal-content-types.html', htmlReport);



    //determine duplicate urls
    let previousURL = '';
    let currentDataDuplicates = [];

    //sort the url list
    jsonDataDuplicates.sort();

    //find duplicates
    //console.log(jsonDataDuplicates);
    jsonDataDuplicates.forEach(currentURL => {
        currentURL = currentURL.toString();

        if (currentURL == previousURL) {
            currentDataDuplicates.push([currentURL]);
        }

        previousURL = currentURL;

    })

    //show duplicates
    console.log(currentDataDuplicates.length + ' duplicate nodes found:');
    //console.log(currentDataDuplicates.join('\n').toString());

}




const argv = yargs
    .options("domain", {
        alias: "d",
        description: "Drupal domain to scrape (dev, prod, pprd, live",
        type: "string",
    })
    //.choices("s", settings)
    .demandOption(["domain"], "Please specify a domain (prod, pprd, dev, live)")
    .help()
    .alias("help", "h").argv;

getAllDrupalURLs(drupalDomains.getDomain(argv.domain), argv.domain);

//createDrupalURLFiles(drupalDomains.getDomain(argv.domain), argv.domain);



