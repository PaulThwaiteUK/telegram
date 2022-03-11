const fs = require('fs');
const yargs = require("yargs");
const fetch = require('node-fetch');
const drupalDomains = require('../local-modules/drupal-domains.js');
const globalSettings = require('../local-modules/report-settings');
const htmlFunctions = require('../local-modules/html-functions');
const { profile } = require('console');

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

//STAFF_PROFILE_DATA_LATEST = REPORTS_DATA_FOLDER + 'staff-profile/field-progress/csv/staff-profile-field-index-20220113 all staff profiles.csv';

function countDifferences() {

    //setup date
    var today = new Date();
    today = today.toDateString() + ' ' + today.toLocaleTimeString();

    //setup arrays
    var duplicateProfiles = [];
    var profileWithDash = [];
    duplicateProfiles.push(['URL 1', 'URL 2', 'Name', 'Email', 'Faculty', 'School'])
    profileWithDash.push(['URL', 'Name', 'Email', 'Faculty', 'School']);

    //read in latest data
    var staffProfileDataLatest = fs.readFileSync(STAFF_PROFILE_DATA_LATEST).toString().split("\n");
    var staffProfileDataAtLaunch = fs.readFileSync(STAFF_PROFILE_DATA_AT_LAUNCH).toString().split("\n");

    //remove first two rows
    var title1 = staffProfileDataLatest[0].split(',');
    var title2 = staffProfileDataLatest[1].split(',');
    staffProfileDataLatest.shift();
    staffProfileDataLatest.shift();
    staffProfileDataAtLaunch.shift();
    staffProfileDataAtLaunch.shift();

    //find urls with a - in them
    /*
    var matchedProfiles = [];
    staffProfileDataLatest.forEach(latestProfile => {

        var profileLatest = latestProfile.split(',');
        var latestURL = profileLatest[0];

        staffProfileDataAtLaunch.forEach(AtLaunchProfile => {

            var profileAtLaunch = AtLaunchProfile.split(',');
            var atLaunchURL = profileAtLaunch[0];

            if (latestURL == atLaunchURL) {

                matchedProfiles.push([profileLatest]);
                //console.log(latestURL + ' - ' + atLaunchURL);
            }
        });
    });
    */

    //find urls with a - in them
    var matchedProfiles = [];
    staffProfileDataAtLaunch.forEach(AtLaunchProfile => {

        var profileAtLaunch = AtLaunchProfile.split(',');
        var atLaunchURL = profileAtLaunch[0];

        staffProfileDataLatest.forEach(latestProfile => {

            var profileLatest = latestProfile.split(',');
            var latestURL = profileLatest[0];
            latestURL = latestURL.replace('oneweb.pprd.soton.ac.uk', 'oneweb.soton.ac.uk')


            //console.log(latestURL + ' - ' + atLaunchURL);

            if (latestURL == atLaunchURL) {

                var urlcolumn = profileAtLaunch[0];
                //profileAtLaunch.shift();
                //profileAtLaunch.unshift('');
                //profileAtLaunch.unshift('');
                //profileAtLaunch.unshift(urlcolumn);
                
                
                profileAtLaunch[32] = '';
                profileAtLaunch[33] = '';
                profileAtLaunch[34] = profileLatest[34];
                profileAtLaunch[35] = profileLatest[35];


                matchedProfiles.push(profileAtLaunch);
                //console.log(profileAtLaunch[32]);
                //console.log(profileAtLaunch[34]);
                //console.log(profileAtLaunch[35]);
            }
        });
    });



    //find duplicates
    let previousURL =  ''
    let currentDataDuplicates = [];
    matchedProfiles.forEach(currentRowArray => {

        //var currentRowArray = currentRow.split(',');
        //console.log(currentRowArray[0]);

        if (currentRowArray[0] == previousURL) {
            currentDataDuplicates.push([currentRowArray[0]]);
        }

        previousURL = currentRowArray[0];

    })

    console.log('Latest = ' + staffProfileDataLatest.length);
    console.log('At launch = ' + staffProfileDataAtLaunch.length);
    console.log('Matched = ' + matchedProfiles.length);
    console.log('Duplicates = ' + currentDataDuplicates.length);

    //console.log(matchedProfiles[34]);
    //console.log(matchedProfiles);

    let chartDataYes = [];
    let chartDataNo = [];
    var data = matchedProfiles;

    for (let index = 0; index < 29; index++) {
        chartDataYes[index] = 0;
        chartDataNo[index] = 0;
    }

    for (let row = 0; row < data.length; row++) {
        const theRow = data[row];

        //console.log(theRow);

        for (let column = 3; column < 29; column++) {
            const theColumn = theRow[column];

            if (column == 23) {
                continue;
              }

            if (theColumn == 'YES') {
                chartDataYes[column - 3]++;
            } else {
                chartDataNo[column - 3]++;
            }

        }
    }

    console.log('Yes = ' + chartDataYes);
    matchedProfiles.unshift(title2);
    matchedProfiles.unshift(title1);

    var csv = matchedProfiles.map(function (d) {
        return d.join();
    }).join('\n');
    fs.writeFileSync('data at launch.csv', csv);

}


countDifferences();