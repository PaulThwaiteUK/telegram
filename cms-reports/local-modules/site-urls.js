//returns an array of URLs

const fs = require('fs');
const drupalDomains = require('../local-modules/drupal-domains.js');


exports.getCoursePageURLs = function (domain) {

    //set an array for the urls
    var urlsList = [];

    //get the domain URL from pre-defined URLs
    var domainURL = drupalDomains.getDomain(domain);

    //define the file containing the URLs
    var URLSFile = '../url-lists/course-page-urls-' + domain + '.json';

    //read the file into an array
    var jsonURLs = fs.readFileSync(URLSFile);
    var jsonLine = JSON.parse(jsonURLs);

    //create an array of urls
    jsonLine.forEach(URL => {

        //create testname by removing first / and replacing all / with -
        var URLtype = URL[0];

        //add domain to the URL
        URL[1] = domainURL + URL[1];

        //ignore blank lines
        if (URLtype != "") {
            urlsList.push([URLtype, URL[1]]);
        }
    });

    return urlsList;

}



exports.getStaffProfileURLs = function (domain) {

    //set an array for the urls
    var urlsList = [];

    //get the domain URL from pre-defined URLs
    var domainURL = drupalDomains.getDomain(domain);

    //define the file containing the URLs
    var URLSFile = '../url-lists/person-urls-' + domain + '.json';

    //read the file into an array
    var jsonURLs = fs.readFileSync(URLSFile);
    var jsonLine = JSON.parse(jsonURLs);

    //create an array of urls
    jsonLine.forEach(profile => {

        personURL = domainURL + profile[0];
        personUsername = profile[1];
        personFaculty = profile[2];
        personSchool = profile[3];
        personSchoolDepartment = profile[4];

        //console.log(URL[0])
        urlsList.push([personURL, personUsername, personFaculty, personSchool, personSchoolDepartment])
    });

    return urlsList;

}


exports.getStaffProfileURLsBackuo = function (domain) {

    //set an array for the urls
    var urlsList = [];

    //get the domain URL from pre-defined URLs
    var domainURL = drupalDomains.getDomain(domain);

    //define the file containing the URLs
    var URLSFile = '../url-lists/person-urls-' + domain + '.json';

    //read the file into an array
    var jsonURLs = fs.readFileSync(URLSFile);
    var jsonLine = JSON.parse(jsonURLs);

    //create an array of urls
    jsonLine.forEach(URL => {

        URL[0] = domainURL + URL[0];

        //console.log(URL[0])
        urlsList.push([URL[0]])
    });

    return urlsList;

}


exports.getResearchProjectURLs = function (domain) {

    //set an array for the urls
    var urlsList = [];

    //get the domain URL from pre-defined URLs
    var domainURL = drupalDomains.getDomain(domain);

    //define the file containing the URLs
    var URLSFile = '../url-lists/research-project-urls-' + domain + '.json';

    //read the file into an array
    var jsonURLs = fs.readFileSync(URLSFile);
    var jsonLine = JSON.parse(jsonURLs);

    //create an array of urls
    jsonLine.forEach(profile => {

        projectTitle = profile[0];
        projectURL = domainURL + profile[1];
        projectFaculty = profile[2];
        projectSchool = profile[3];

        //console.log(URL[0])
        urlsList.push([projectURL, projectTitle, projectFaculty, projectSchool])
    });

    return urlsList;
}



exports.getFullRegressionTestURLs = function (domain) {

    //set an array for the urls
    var urlsList = [];

    //get the domain URL from pre-defined URLs
    var domainURL = drupalDomains.getDomain(domain);

    //define the file containing the URLs
    var URLSFile = '../url-lists/wider-regression-urls-' + domain + '.json';

    //read the file into an array
    var jsonURLs = fs.readFileSync(URLSFile);
    var jsonLine = JSON.parse(jsonURLs);

    //create an array of urls
    jsonLine.forEach(URL => {

        URL[0] = domainURL + URL[0];
        urlsList.push([URL[0]])
    });

    return urlsList;

}


exports.getTestURLs = function (domain, type) {

    //get the domain URL from pre-defined URLs
    var domainURL = drupalDomains.getDomain(domain);

    var URLSFile;
    var testURLs = [];

    //determine which URLs are needed
    if (type == 'education') {
        URLSFile = '../url-lists/course-page-urls-' + domain + '.json';
    }

    if (type == 'person') {
        URLSFile = '../url-lists/person-urls-' + domain + '.json';
    }

    //education URLs schema
    // - course type (UG or PGT)
    // - url

    //person URLs schema
    // - url

    //read the file into an array
    var jsonURLs = fs.readFileSync(URLSFile);
    var jsonLine = JSON.parse(jsonURLs);

    //create an array with 'testname' and 'url' 
    jsonLine.forEach(URL => {

        if (type == 'person') {

            URL[0] = domainURL + URL[0];
            testURLs.push([URL[0]])
        }

        if (type == 'education') {

            //create testname by removing first / and replacing all / with -
            var URLtype = URL[0];

            //add domain to the URL
            URL[1] = domainURL + URL[1];

            if (URLtype != "") {
                testURLs.push([URLtype, URL[1]]);
            }
        }
    });

    return testURLs;
}


