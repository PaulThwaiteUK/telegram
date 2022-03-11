const fs = require('fs');
const yargs = require("yargs");
const fetch = require('node-fetch');
const drupalDomains = require('../local-modules/drupal-domains.js');
const globalSettings = require('../local-modules/report-settings');
const htmlFunctions = require('../local-modules/html-functions');

//get reportts folder
const REPORTS_DATA_FOLDER = globalSettings.getReportsFolder();

//get today's date
var DATE_TODAY = globalSettings.getTimestamp('today', 'yymmdd');
var DATE_YESTERDAY = globalSettings.getTimestamp('yesterday', 'yymmdd');

//define data files
STAFF_PROFILE_DATA_FIELD_USAGE_AT_LAUNCH = [];
STAFF_PROFILE_DATA_AT_LAUNCH = REPORTS_DATA_FOLDER + 'staff-profile/field-progress/csv/staff-profile-field-index-20211128.csv';
STAFF_PROFILE_DATA_PREVIOUS = REPORTS_DATA_FOLDER + 'staff-profile/field-progress/csv/staff-profile-field-index-' + DATE_YESTERDAY + '.csv';
STAFF_PROFILE_DATA_LATEST = REPORTS_DATA_FOLDER + 'staff-profile/field-progress/csv/staff-profile-field-index-' + DATE_TODAY + '.csv';

function findDuplicateURLs() {

    //setup date
    var today = new Date();
    today = today.toDateString() + ' ' + today.toLocaleTimeString();

    //setup arrays
    var duplicateProfiles = [];
    var profileWithDash = [];
    duplicateProfiles.push(['URL 1', 'URL 2', 'Name', 'Email 1', 'Email 2', 'Faculty', 'School'])
    profileWithDash.push(['URL', 'Name', 'Email', 'Faculty', 'School']);

    //read in data
    var staffProfileData = fs.readFileSync(STAFF_PROFILE_DATA_LATEST).toString().split("\n");

    //remove first two rows
    staffProfileData.shift;
    staffProfileData.shift;

    //find urls with a - in them
    var previousURL = '';
    var previousEmail = '';
    staffProfileData.forEach(profile => {

        var profileArray = profile.split(',');

        var url = profileArray[0];
        var name = profileArray[28];
        var email = profileArray[32];
        var faculty = profileArray[33];
        var school = profileArray[34];

        var minusCheck = url.slice(-2);

        if (minusCheck.indexOf('-') >= 0) {

            //remove the -x 
            var duplicateCheck = url.substring(0, url.length - 2);

            if (duplicateCheck == previousURL) {
                duplicateProfiles.push([previousURL, url, name, email, previousEmail, faculty.toString(), school.toString()]);
            } else {
                profileWithDash.push([url, name, email, faculty.toString(), school.toString()]);
            }
        }

        previousURL = url;
        previousEmail = email;
    });

    var duplicateProfileCount = duplicateProfiles.length - 1;
    var profileWithDashCount = profileWithDash.length - 1;

    console.log(duplicateProfileCount + ' duplicate profiles');
    //console.log(duplicateProfiles);

    console.log(profileWithDashCount - 1 + ' dash url');
    //console.log(profileWithDash);

    //create html report
    var htmlReport = '';
    htmlReport += '<html><head></head><body>';
    htmlReport += '<h1>Digital UX - Staff profile duplicate urls</h1>';
    htmlReport += '<div>Report date : ' + today + '</div>';
    htmlReport += '<hr>';
    htmlReport += '<h2>Duplicate URLs</h2>';
    htmlReport += '<div>' + duplicateProfileCount + ' staff members with two profiles </div>';
    htmlReport += '<br>';
    htmlReport += htmlFunctions.generateTable(duplicateProfiles);
    htmlReport += '<hr>';
    htmlReport += '<h2 id="added">Staff profiles with a minus in the URL </h2>';
    htmlReport += '<div>' + profileWithDashCount + ' staff members with a minus in the URL</div>';
    htmlReport += '<br>';
    htmlReport += htmlFunctions.generateTable(profileWithDash);
    htmlReport += '</body></html>';
    fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/duplicate-profiles/html/staff-profile-duplicate-profiles-' + DATE_TODAY + '.html', htmlReport);
    fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/duplicate-profiles/html/staff-profile-duplicate-profiles.html', htmlReport);


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

findDuplicateURLs(drupalDomains.getDomain(argv.domain), argv.domain);

