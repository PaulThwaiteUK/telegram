const fs = require('fs');
const yargs = require("yargs");
const fetch = require('node-fetch');
const drupalDomains = require('../local-modules/drupal-domains.js');

var json_data = [];
var drupalURLs = [];
var latestSize = 500;
var offsetSize = 500;
var personContentType = [];
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


async function getPeopleURLs(domainURL, domain) {

    //we do not know how big the drupal blob is let's 
    //set a huge number of Drupal nodes / URLs
    var target = 100000;

    console.log('Downloading Drupal nodes from the ' + domainURL + ' server');
    console.log('Offset ');

    //fetch the data at 100 URLs at a time
    for (let offset = 0; offset < target; offset += offsetSize) {

        //console.log(' - ' + offset);

        var urls = [];
        urls.push(domainURL + '/api/pages-persons?_format=hal_json&items_per_page=500&offset=' + offset);

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
    //   - title - person name 
    //   - view mode - url
    //   - type - person
    //   - field_person_username - username
    //   - field_pure_id - pure id
    //   - field_person_faculty - faculty
    //   - field_person_school - school

    //write the drupal jso data to a file
    //not used - useful for debuggging
    var blah = JSON.stringify(json_data, null, 3);
    fs.writeFileSync('../url-lists/drupal-person-nodes-data-' + domain + '.json', blah);

    //loop through each person
    //build an array of URLs, school and faculty
    for (let index = 0; index < json_data.length; index++) {
        const element = json_data[index];

        for (let x = 0; x < element.length; x++) {

            var jsonObj = {};

            //person name
            var personName = json_data[index][x].title;

            //person url
            var personURL = json_data[index][x].view_node;

            //person type
            var personType = json_data[index][x].type;

            //person username
            var personUsername = json_data[index][x].field_person_username;

            //person pure id
            var personPureID = json_data[index][x].field_pure_id;

            //person faculty
            var personSchoolDepartment = json_data[index][x].field_person_school_dept;

            //person faculty
            var personFaculty = json_data[index][x].field_ref_po_faculty;

            //person school
            var personSchool = json_data[index][x].field_ref_po_school;

            //add url to an array for duplicate analysis
            jsonDataDuplicates.push([personURL.toString()]);

            //add the testname, url, and title to an object to be used to create json
            jsonObj.person_name = personName;
            jsonObj.person_name = personUsername;
            jsonObj.person_url = personURL;
            jsonObj.person_faculty = personFaculty;
            jsonObj.person_school = personSchool;
            jsonObj.person_school_department = personSchoolDepartment;

            //add the json object to an array
            drupalURLs.push(jsonObj);
            personContentType.push([personURL, personUsername, personFaculty, personSchool, personSchoolDepartment]);
        }
    }

    //write a txt file for regression testing
    personContentType.sort();
    var reportString = JSON.stringify(personContentType, null, 3);
    fs.writeFileSync('../url-lists/person-urls-' + domain + '.json', reportString);
    fs.writeFileSync('../url-lists/person-urls-' + domain + '.txt', personContentType.toString());

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
    console.log(drupalURLs.length + ' staff profiles found')

    //show duplicates
    console.log('');
    console.log(currentDataDuplicates.length + ' duplicate person records found:');
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

getPeopleURLs(drupalDomains.getDomain(argv.domain), argv.domain);



