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




// perform a fetch to the json blob with specified offset
/*
async function fetchDataAsync(offset) {
    const response = await fetch('https://oneweb.pprd.soton.ac.uk/api/pages?_format=hal_json&items_per_page=100&offset=' + offset);
    console.log(await response.json())

    json_data.push(response.json());

}*/


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

async function getDrupalURLs(domainURL, domain) {

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


async function createDrupalURLFiles(domainURL, domain) {

    var drupalFeedData = await getDrupalURLs(domainURL, domain);

    //var drupalFeedData = await getDrupalURLss(domainURL, domain);



    //course page
    //createCoursePageURLFile(drupalFeedData, domain);

    //backstopjs regression
    //createBackstopJSURLFile(drupalFeedData, domain);

    //staff profile
    createStaffProfileURLFile(drupalFeedData, domain);
}




async function getDrupalURLss(domainURL, domain) {

    //we do not know how big the drupal blob is let's 
    //set a huge number of Drupal nodes / URLs
    var target = 100000;

    console.log('Downloading Drupal nodes from the ' + domainURL + ' server');
    console.log('Offset ');

    //fetch the data at 100 URLs at a time
    for (let offset = 0; offset < target; offset += 100) {

        //console.log(' - ' + offset);

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

    for (let index = 0; index < json_data.length; index++) {
        const element = json_data[index];

        console.log(element.length);

        for (let x = 0; x < element.length; x++) {

            var jsonObj = {};

            //get the URL to the node and replace / with -
            var urlname = json_data[index][x].view_node.replace(/\//g, "-");

            //create a testname for visual regression
            var testname = json_data[index][x].type.replace(/\s/g, "-");

            //get the conten type
            var pagetype = json_data[index][x].type;

            //create the testname for visual regressoon
            testname = testname + urlname;
            testname = testname.toLowerCase();

            //store the node URL
            testurl = json_data[index][x].view_node;

            //add url to an array for duplicate analysis
            jsonDataDuplicates.push([testurl.toString()]);

            //add the testname, url, and title to an object to be used to create json
            jsonObj.testname = testname;
            jsonObj.url = json_data[index][x].view_node;
            jsonObj.title = json_data[index][x].title;

            //add the json object to an array
            drupalURLs.push(jsonObj);

            //add the visual regression test scenarios in an array
            dataTypes.push([json_data[index][x].type, json_data[index][x].view_node, json_data[index][x].title]);

            //filter on content type to test
            //we do not want to test
            // - person
            // - CRUMS data
            if ((pagetype == 'Article') || (pagetype == 'Basic page') || (pagetype == 'Campaign') || (pagetype == 'Campus') || (pagetype == 'City') || (pagetype == 'Event') || (pagetype == 'Filter Listing') || (pagetype == 'Hall')
                || (pagetype == 'Paginated Listing') || (pagetype == 'Primary Index Page') || (pagetype == 'Secondary Index Page') || (pagetype == 'VOD_Itinerary')) {

                regressionTestURLs.push([testname, testurl]);
            }

            //
            //store person content types to an array
            //used for staff profile tests
            //
            if (pagetype == 'Person') {
                personContentType.push([testurl]);
            }

            //
            //store research project types to an array
            //
            if (pagetype == 'Research Project') {

                projectContentType.push([testurl])
            }


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

            //store the content type name for later use
            contentTypes.push(pagetype);
            if (pagetype == previousContentType) {
                contentTypeList.push(['', 'https://oneweb.soton.ac.uk/' + testurl]);
            } else {
                contentTypeList.push([pagetype, 'https://oneweb.soton.ac.uk/' + testurl]);
            }

            //count the number of content types found
            if (contenTypesCount[pagetype] == undefined) {
                contenTypesCount[pagetype] = 1;
            }
            else {
                contenTypesCount[pagetype] = contenTypesCount[pagetype] + 1;
            }

            previousContentType = contentTypes.push(pagetype);
        }
    }

    //
    // visual regressioon tests need to test
    // - a module
    // - a UG course page
    // - a PGT course page 
    // add these manually because we don't want to test all UG, PGT and MODULE pages
    //
    regressionTestURLs.push(['hall-student-life-accommodation-halls', '/student-life/accommodation/halls']);
    regressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc']);
    regressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#entry']);
    regressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#structure']);
    regressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#modules']);
    regressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#learning']);
    regressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#careers']);
    regressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#fees']);
    regressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#apply']);
    regressionTestURLs.push(['ug-course', '/courses/accounting-and-finance-degree-bsc#related']);
    regressionTestURLs.push(['crums-module-data', '/courses/modules/mang1014']);
    regressionTestURLs.push(['crums-module-data', '/courses/modules/mang1014#aims']);
    regressionTestURLs.push(['crums-module-data', '/courses/modules/mang1014#syllabus']);
    regressionTestURLs.push(['crums-module-data', '/courses/modules/mang1014#learning']);
    regressionTestURLs.push(['crums-module-data', '/courses/modules/mang1014#assessment']);

    //
    // update the console with a sorted list of unique content types
    console.log('Total published content types (nodes) on prod = ' + drupalURLs.length);
    var uniqueContentTypes = [...new Set(contentTypes)];
    var uniqueContentTypesCount = [];
    uniqueContentTypes.sort();
    uniqueContentTypes.forEach(type => {
        console.log('- ' + type + '(' + contenTypesCount[type] + ']');
        count = contenTypesCount[type].toString();
        uniqueContentTypesCount.push([type, count]);
    });


    //
    //write URLs to a file
    //

    /*
    var csvMODULE;
    if (dataTypes.length > 0) {
        var csvMODULE = dataTypes.map(function (d) {
            return d.join();
        }).join('\n');
 
        //console.log(csvMODULE);
        fs.writeFileSync('liveURLs.csv', csvMODULE);
    }
    */

    //write a txt file for regression testing
    regressionTestURLs.sort();
    var filearray = regressionTestURLs.join('\n').toString();
    fs.writeFileSync('../url-lists/backstopjs-regression-url-list.txt', filearray);

    //write a txt file for regression testing
    personContentType.sort();
    var reportString = JSON.stringify(personContentType, null, 3);
    fs.writeFileSync('../url-lists/person-urls-' + domain + '.json', reportString);
    fs.writeFileSync('../url-lists/person-urls-' + domain + '.txt', personContentType.toString());

    //write a txt file for regression testing
    projectContentType.sort();
    reportString = JSON.stringify(projectContentType, null, 3);
    fs.writeFileSync('../url-lists/research-project-urls-' + domain + '.json', reportString);
    fs.writeFileSync('../url-lists/research-project-urls-' + domain + '.txt', projectContentType.toString());



    //write a txt file for education reports
    /*
    coursePagesPGTURLs.sort(function (a, b) {
        return a[1] - b[1];
    });
    coursePagesUGURLs.sort(function (a, b) {
        return a[1] - b[1];
    });
    */

    var coursePagesURLs = [];
    coursePagesURLs = coursePagesUGURLs.concat(coursePagesPGTURLs);
    var coursePagesURLsString = JSON.stringify(coursePagesURLs, null, 3);
    fs.writeFileSync('../url-lists/course-page-urls-' + domain + '.json', coursePagesURLsString);
    fs.writeFileSync('../url-lists/course-page-urls-' + domain + '.txt', coursePagesURLs.toString());

    //write person content type URLs to a file
    //this is used for staff profile testing
    var csvMODULE;
    if (personContentType.length > 0) {
        var csvMODULE = personContentType.map(function (d) {
            return d.join();
        }).join('\n');

        //console.log(csvMODULE);
        fs.writeFileSync('../url-lists/staff-profile-urls-' + domain + '.csv', csvMODULE);
    }


    //write html table for list of all content types and urls
    var today = new Date();
    today = today.toDateString() + ' ' + today.toLocaleTimeString();
    var htmlReport = '';
    contentTypeList.sort();
    htmlReport += '<html><head></head><body>';
    htmlReport += '<h1>Digital UX - Published URLs by page type</h1>';
    //htmlReport += '<br>';
    htmlReport += '<h2>Report date : ' + today + '</h2>';
    htmlReport += '<hr>';
    htmlReport += '<h2>Published URLs by content type</h2>';
    htmlReport += '<div>Total list of URLs on PROD by content type (including URLs hiding behind nginx)</div>';
    htmlReport += '<br>';
    htmlReport += htmlTable.generateTable(uniqueContentTypesCount);
    htmlReport += '<br>'
    htmlReport += '<h2>Published URLs by content type</h2>';
    htmlReport += '<div>Current list of URLs on PROD by content type (including URLs hiding behind nginx)</div>';
    htmlReport += '<br>';
    htmlReport += htmlTable.generateTable(contentTypeList);
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
    console.log(currentDataDuplicates.join('\n').toString());

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

getDrupalURLss(drupalDomains.getDomain(argv.domain), argv.domain);

//createDrupalURLFiles(drupalDomains.getDomain(argv.domain), argv.domain);



