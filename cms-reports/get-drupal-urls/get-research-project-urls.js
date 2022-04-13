const fs = require('fs');
const yargs = require("yargs");
const fetch = require('node-fetch');
const drupalDomains = require('../local-modules/drupal-domains.js');

var json_data = [];
var drupalURLs = [];
var latestSize = 500;
var offsetSize = 500;
var itemsPerPage = 500;
var projectContentType = [];
var jsonDataDuplicates = [];

//this function returns URLs for section of the json blob
//it is messy and it works - I will put a better solution in place at some point
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


        var blah = JSON.stringify(data, null, 3);
        if (blah.toString().indexOf('No route found') > -1) {
            console.log('Error downloading URLs : ' + blah);
            process.exit();
        }

    } catch (error) {
        console.log(error)
        throw (error)
    }
}


async function getResearchProjectURLs(domainURL, domain) {

    //we do not know how big the drupal blob is let's 
    //set a huge number of Drupal nodes / URLs
    var target = 100000;

    console.log('Downloading Drupal nodes from the ' + domainURL + ' server');
    console.log('Offset ');

    //fetch the data at 100 URLs at a time
    for (let offset = 0; offset < target; offset += offsetSize) {

        //console.log(' - ' + offset);

        var urls = [];
        urls.push(domainURL + '/api/projects-export?_format=hal_json&items_per_page=' + itemsPerPage + '&offset=' + offset);


        //if latestSize is less than 100 then we have reached the end of the json stream
        //not brilliant but it works fine

        if (latestSize < offsetSize) {
            offset = target;
        }
        else {
            await getAllUrls(urls);
            console.log('--' + latestSize + ' ' + urls);
        }

    }

    //parse the json data into an array
    //each node contains 
    //   - title - project name 
    //   - type - research_project
    //   - nid - project url
    //   - field_ref_po_faculty - faculty
    //   - field_ref_po_school - school

    //write the drupal jso data to a file
    //not used - useful for debuggging
    var blah = JSON.stringify(json_data, null, 3);
    fs.writeFileSync('../url-lists/drupal-research-projects-nodes-data-' + domain + '.json', blah);

    //loop through each project
    //build an array of URLs, school and faculty
    for (let index = 0; index < json_data.length; index++) {
        const element = json_data[index];

        for (let x = 0; x < element.length; x++) {

            var jsonObj = {};

            //project name
            var projectName = json_data[index][x].title;

            //project url
            var projectURL = json_data[index][x].nid;

            //project type
            var projectType = json_data[index][x].type;

            //project faculty
            var projectFaculty = json_data[index][x].field_ref_po_faculty;

            //project school
            var projectSchool = json_data[index][x].field_ref_po_school;

            //add url to an array for duplicate analysis
            jsonDataDuplicates.push([projectURL.toString()]);

            //add the testname, url, and title to an object to be used to create json
            jsonObj.project_name = projectName;
            jsonObj.project_url = projectURL;
            jsonObj.project_faculty = projectFaculty;
            jsonObj.project_school = projectSchool;

            //add the json object to an array
            drupalURLs.push(jsonObj);
            projectContentType.push([projectName, projectURL, projectFaculty, projectSchool]);
        }
    }

    //write a txt file for regression testing
    projectContentType.sort();
    var reportString = JSON.stringify(projectContentType, null, 3);
    fs.writeFileSync('../url-lists/research-project-urls-' + domain + '.json', reportString);
    fs.writeFileSync('../url-lists/research-project-urls-' + domain + '.txt', projectContentType.toString());

    //write project content type URLs to a file
    //this is used for staff profile testing
    var csvMODULE;
    if (projectContentType.length > 0) {
        var csvMODULE = projectContentType.map(function (d) {
            return d.join();
        }).join('\n');

        //console.log(csvMODULE);
        fs.writeFileSync('../url-lists/research-project-urls-' + domain + '.csv', csvMODULE);
    }

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

    //show total number of people 
    console.log('');
    console.log(drupalURLs.length + ' research projects found')

    //show duplicates
    console.log('');
    console.log(currentDataDuplicates.length + ' duplicate project records found:');
    console.log(currentDataDuplicates.join('\n').toString());
    console.log('');

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

getResearchProjectURLs(drupalDomains.getDomain(argv.domain), argv.domain);



