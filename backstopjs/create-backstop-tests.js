const fs = require('fs');
const { domain } = require('process');
const yargs = require("yargs");
const fetch = require('node-fetch');
const globalSettings = require('../cms-reports/local-modules/report-settings');
const { config } = require('yargs');

var json_data = [];
var latestSize = 100;

//backstop regression tests
const BACKSTOP_SCENARIOS_JSON_FILE = './scenarios/backstop-regression-tests.json';
const TEST_RANDOM_SIZE = 10;

//verbose
verbose = false;

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


async function getURLSFromDrupal(referenceDomain) {
    //we do not know how big the drupal blob is let's 
    //set a huge number of Drupal nodes / URLs
    var target = 100000;

    //use prod to download Drupal urls
    var apiDrupalServer = globalSettings.getDomain('prod');

    console.log('Downloading urls from ' + apiDrupalServer + '.  Please wait.');

    //fetch the data at 100 URLs at a time
    for (let offset = 0; offset < target; offset += 100) {

        var urls = [];
        urls.push(apiDrupalServer + '/api/pages?_format=hal_json&items_per_page=100&offset=' + offset);

        //if latestSize is less than 100 then we have reached the end of the json stream
        //not brilliant but it works fine
        if (latestSize < 100) {
            offset = target;
        }
        else {
            await getAllUrls(urls);

            if (verbose) {
                console.log('--' + latestSize + ' ' + urls);
            }
        }
    }

    return json_data;
}

function getURLSByContentType(drupalURLData) {

    var urlsByContentTypes = [];

    for (let index = 0; index < drupalURLData.length; index++) {
        const element = drupalURLData[index];

        for (let x = 0; x < element.length; x++) {

            //get the data
            var title = drupalURLData[index][x].title;
            var pageURL = drupalURLData[index][x].view_node;
            var contentType = drupalURLData[index][x].type;

            //console.log(title + ' - ' + pageURL + ' - ' + contentType);

            //add jsonobj type info to an array for writing to files
            if (urlsByContentTypes[contentType] == undefined) {
                urlsByContentTypes[contentType] = [];
            }

            urlsByContentTypes[contentType].push([contentType, pageURL]);
        }
    }

    return urlsByContentTypes;
}


function getContentTypes(drupalURLData) {

    var contentTypes = [];

    for (let index = 0; index < drupalURLData.length; index++) {
        const element = drupalURLData[index];

        for (let x = 0; x < element.length; x++) {

            //get the data
            var title = drupalURLData[index][x].title;
            var pageURL = drupalURLData[index][x].view_node;
            var contentType = drupalURLData[index][x].type;

            //add content type to an array, we will filter later
            contentTypes.push(contentType);
        }
    }

    var uniqueListContentTypes = [...new Set(contentTypes)];
    uniqueListContentTypes.sort();

    return uniqueListContentTypes;
}



function listContentTypes(drupalURLData, contentTypeList) {

    console.log('');
    console.log('List of content types : ')
    console.log('');

    contentTypeList.forEach(contentType => {

        if (drupalURLData[contentType] != undefined) {
            console.log('- ' + contentType + ' [' + drupalURLData[contentType].length + ']');
        }
    });
}


function generateRandomSelection(contentTypeURLs, quantity) {

    var shortList = [];
    var alreadySelected = [];

    for (let index = 0; index < quantity; index++) {

        var position = Math.floor(Math.random() * contentTypeURLs.length);

        if (checkUnique(alreadySelected, position)) {
            shortList.push(contentTypeURLs[position]);
            alreadySelected.push(position);
        } else {
            index--;
        }
    }

    return shortList;
}

function checkUnique(alreadySelected, newPosition) {

    var unique = true;

    alreadySelected.forEach(pos => {

        if (pos == newPosition) {
            unique = false;
        }
    });

    return unique;
}


function filterURLSByScope(urlsByContentTypes, scope, numberTestsPerContentType) {

    const TEST_ALL_CONTENT_TYPES = ['Article', 'Basic page', 'Campaign', 'Campus', 'City', 'Crums Module Data', 'EDU Facility', 'Event', 'Filter Listing', 'Hall', 'PGR Project', 'PGR Topic', 'PGT Course', 'Paginated Listing',
        'Person', 'Primary Index Page', 'Research Group', 'Research Institute and Centre', 'Research Project', 'Research area', 'Research facility', 'esearch highlight story', 'Research partner', 'Secondary Index Page', 'Study highlight story', 'Subject area', 'UG Course', 'VOD Itinerary',]

    var urlContentTypesSelected = [];

    //select all content types
    //limit number of pages to set quantity for course pages, modules, research projects, and people
    if (scope == 'test-all') {

        //loop through all content types (if defined) and select tests randomly
        TEST_ALL_CONTENT_TYPES.forEach(contentType => {

            //these content types are big in numbers
            //select 10 only at random
            //otherwise use them all

            //if array not defined
            if (urlContentTypesSelected[contentType] == undefined) {
                urlContentTypesSelected[contentType] = [];
            }

            //randomly select set quantity from content types with many pages
            if ((contentType == 'Crums Module Data') || (contentType == 'PGT Course') || (contentType == 'Person') || (contentType == 'Research Project') || (contentType == 'UG Course') || (contentType == 'VOD Itinerary')) {

                var shortList = generateRandomSelection(urlsByContentTypes[contentType], numberTestsPerContentType);
                urlContentTypesSelected[contentType] = shortList;

            } else {

                urlContentTypesSelected[contentType] = urlsByContentTypes[contentType];
            }
        });
    }

    //select all content types
    //randomly select pages for content types with many pages
    if (scope == 'test-random') {

        //loop through all content types (if defined) and select tests randomly
        TEST_ALL_CONTENT_TYPES.forEach(contentType => {

            if (urlsByContentTypes[contentType] != undefined) {

                //if array not defined
                if (urlContentTypesSelected[contentType] == undefined) {
                    urlContentTypesSelected[contentType] = [];
                }

                //if total number of pages is greater than the set quantity (default 10)
                //randomly select pages
                if (urlsByContentTypes[contentType].length > numberTestsPerContentType) {

                    var shortList = generateRandomSelection(urlsByContentTypes[contentType], numberTestsPerContentType);
                    urlContentTypesSelected[contentType] = shortList;
                } else {

                    //less than set quantity 
                    urlContentTypesSelected[contentType] = urlsByContentTypes[contentType];
                }
            }
        })
    }

    //UG and PGT course pages
    //add all pages
    if (scope == 'test-course-pages') {

        //UG Course
        urlContentTypesSelected['UG Course'] = [];
        urlContentTypesSelected['UG Course'] = urlsByContentTypes['UG Course'];

        //PGT Course
        urlContentTypesSelected['PGT Course'] = [];
        urlContentTypesSelected['PGT Course'] = urlsByContentTypes['PGT Course'];
    }


    //add tabs to the UG Course, PGT Course and Crums Module Data content types
    //UG Course
    if (urlContentTypesSelected['UG Course'] != undefined) {

        var coursePageTabs = [];

        urlContentTypesSelected['UG Course'].forEach(url => {

            var contentType = url[0];
            var courseURL = url[1];

            coursePageTabs.push([contentType, courseURL]);
            coursePageTabs.push([contentType, courseURL + '#entry']);
            coursePageTabs.push([contentType, courseURL + '#structure']);
            coursePageTabs.push([contentType, courseURL + '#modules']);
            coursePageTabs.push([contentType, courseURL + '#learning']);
            coursePageTabs.push([contentType, courseURL + '#careers']);
            coursePageTabs.push([contentType, courseURL + '#fees']);
            coursePageTabs.push([contentType, courseURL + '#apply']);
            coursePageTabs.push([contentType, courseURL + '#related']);
        });

        urlContentTypesSelected['UG Course'] = coursePageTabs;
    }

    //PGT Course
    if (urlContentTypesSelected['PGT Course'] != undefined) {

        var coursePageTabs = [];

        urlContentTypesSelected['PGT Course'].forEach(url => {

            var contentType = url[0];
            var courseURL = url[1];

            coursePageTabs.push([contentType, courseURL]);
            coursePageTabs.push([contentType, courseURL + '#entry']);
            coursePageTabs.push([contentType, courseURL + '#structure']);
            coursePageTabs.push([contentType, courseURL + '#modules']);
            coursePageTabs.push([contentType, courseURL + '#learning']);
            coursePageTabs.push([contentType, courseURL + '#careers']);
            coursePageTabs.push([contentType, courseURL + '#fees']);
            coursePageTabs.push([contentType, courseURL + '#apply']);
            coursePageTabs.push([contentType, courseURL + '#related']);
        });

        urlContentTypesSelected['PGT Course'] = coursePageTabs;
    }

    //Course modules
    if (urlContentTypesSelected['Crums Module Data'] != undefined) {

        var modulePageTabs = [];

        urlContentTypesSelected['Crums Module Data'].forEach(url => {

            var contentType = url[0];
            var moduleURL = url[1];

            coursePageTabs.push([contentType, moduleURL]);
            coursePageTabs.push([contentType, moduleURL + '#aims']);
            coursePageTabs.push([contentType, moduleURL + '#syllabus']);
            coursePageTabs.push([contentType, moduleURL + '#learning']);
            coursePageTabs.push([contentType, moduleURL + '#assessment']);
        });

        urlContentTypesSelected['Crums Module Data'] = modulePageTabs;
    }



    return urlContentTypesSelected;


}


function getTestcases(filteredContentTypes, referenceDomain, testDomain, contentTypesList, testDelay) {

    var testcaseScenarios = [];

    if (verbose) {
        console.log('');
        console.log('');
        console.log('Content types and urls selected :');
    }

    contentTypesList.forEach(ct => {

        contentTypeURLS = filteredContentTypes[ct];



        if (contentTypeURLS != undefined) {

            if (verbose) {
                console.log('ct len = ' + contentTypeURLS.length);
            }

            contentTypeURLS.forEach(item => {

                var contentType = item[0];
                var url = item[1];

                if (verbose) {
                    console.log(contentType + ' - ' + url);
                }

                //get the URL to the node and replace / with -
                var urlname = url.replace(/\//g, "-");

                //create a testname for visual regression - remove spaces
                var contentTypeName = contentType.replace(/\s/g, "-");

                //create the testname for visual regressoon
                testname = contentTypeName + urlname;
                testname = testname.toLowerCase();

                //create json style object
                var jsonObj = {};
                jsonObj.label = testname;
                jsonObj.referenceUrl = referenceDomain + url;
                jsonObj.url = testDomain + url;
                jsonObj.onReadyScript = "puppet/onReady.js";
                jsonObj.removeSelectors = [];
                jsonObj.removeSelectors.push('#GeckoChatWidget'),
                    jsonObj.removeSelectors.push('#kis-widget_1'),
                    //jsonObj.removeSelectors.push('div.z-200.bg-prussian.text-white.relative.flex.justify-between.items-center.lg\:pl-5.div.button')
                    jsonObj.hideSelectors = [];
                jsonObj.hideSelectors.push('#btn.btn-top.btn-primary.z-10.btn-top--display')
                jsonObj.delay = testDelay;

                //add to array
                testcaseScenarios.push(jsonObj);

            });
        }
    });

    //write json file
    const jsonString = JSON.stringify(testcaseScenarios, null, 3);
    fs.writeFileSync(BACKSTOP_SCENARIOS_JSON_FILE, jsonString);

    return testcaseScenarios;
}

async function generateTestcase_runner(referenceDomain, testDomain, scope, printSelectedTests, numberTestsPerContentType, displayContentTypes, testDelay) {

    //get domains
    var referenceDomain = globalSettings.getDomain(referenceDomain);
    var testDomain = globalSettings.getDomain(testDomain);

    console.log('');
    console.log('BackstopJS visual regression - testcase generator');
    console.log('');
    console.log('Reference domain       : ' + referenceDomain);
    console.log('Test domain            : ' + testDomain);
    console.log('');
    console.log('Test scope             : ' + scope);
    console.log('Pages per content type : ' + numberTestsPerContentType);
    console.log('');

    //get drupal urls from api
    var drupalURLData = [];
    drupalURLData = await getURLSFromDrupal(referenceDomain);

    //create array of urls by content type
    var urlsByContentType = getURLSByContentType(drupalURLData);

    //get list of content types
    var contentTypesList = getContentTypes(drupalURLData);

    //display list of content types to console
    listContentTypes(urlsByContentType, contentTypesList);

    //filter content types and URLs based on scope
    var filteredContentTypes = filterURLSByScope(urlsByContentType, scope, numberTestsPerContentType);

    //generate test cases
    var testcases = getTestcases(filteredContentTypes, referenceDomain, testDomain, contentTypesList, testDelay);

    console.log('');
    console.log('Created ' + testcases.length + ' tests in ' + BACKSTOP_SCENARIOS_JSON_FILE);
    console.log('');
    console.log('Run backstopJS :');
    console.log('');
    console.log('Create reference images    : npm run test-reference');
    console.log('Run visual regression test : npm run test-run');
    console.log('');
    console.log('');
}

const argv = yargs
    .options("reference", {
        alias: "r",
        description: "Set the reference domain (prod | pprd | dev | test | other)",
        type: "string"
    })
    .options("test", {
        alias: "t",
        description: "Set the test domain (prod | pprd | dev | test | other)",
        type: "string"
    })
    .options("scope", {
        alias: "s",
        description: "Set the scope of the visual regression test (test-all | test-random | test-course-pages)",
        type: "string"
    })
    .options("quantity", {
        alias: "q",
        description: "Set the number of tests to be selected for each content type (defaults to 10)",
        type: "string"
    })
    .options("delay", {
        alias: "d",
        description: "Set the test delay in ms (defaults to 5000)",
        type: "string"
    })
    .options("verbose", {
        alias: "v",
        description: "Turn on verbose output (true | false)",
        type: "string"
    })
    //.choices("s", settings)
    .default("v", 'false')
    .default("q", '10')
    .default("d", '5000')
    .demandOption(["scope"], "Please specify a test scope (test-all | test-random | test-course-pages)")
    .demandOption(["reference"], "Please specify a reference domain (prod | pprd | dev | test | other)")
    .demandOption(["test"], "Please specify a test domain (prod | pprd | dev | test | other)")
    .help('')
    .alias("help", "h").argv;

//set global verbose
if (argv.verbose == 'true') {
    verbose = true;
}

//runner
generateTestcase_runner(argv.reference, argv.test, argv.scope, argv.verbose, argv.quantity, argv.list, argv.delay);



