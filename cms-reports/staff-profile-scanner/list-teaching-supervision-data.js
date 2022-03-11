const fs = require('fs');
const htmlFunctions = require('../local-modules/html-functions');
const yargs = require("yargs");
const globalSettings = require('../local-modules/report-settings');

const REPORTS_DATA_FOLDER = globalSettings.getReportsFolder();
const URL_LISTS_FOLDER = globalSettings.getUrlListsFolder();

//DATA CONST
var DATE_TODAY = globalSettings.getTimestamp('today', 'yymmdd');
var DATE_YESTERDAY = globalSettings.getTimestamp('yesterday', 'yymmdd');


PROJECTS_DATA_FOLDER = REPORTS_DATA_FOLDER + 'research-projects/field-progress/csv/research-projects-data-field-progress-' + DATE_TODAY + '.csv';
STAFF_PROFILE_DATA_LATEST = REPORTS_DATA_FOLDER + 'staff-profile/field-progress/csv/staff-profile-field-index-' + DATE_TODAY + '.csv';


function displayTopTeachingData(quantity) {

    var projectDataRaw;
    var staffDataRaw;
    var projectData = [];

    //read in data
    try {
        console.log('**');
        staffDataRaw = fs.readFileSync(STAFF_PROFILE_DATA_LATEST).toString().split("\n");
    } catch (error) {
        console.log('Error loading file' + error);
        process.exit();
    }

    console.log('');
    console.log('Staff data for today is in ' + STAFF_PROFILE_DATA_LATEST);

    var staffData = [];

    staffDataRaw.forEach(staffRow => {
        var staffRowArray = staffRow.split(',');
        staffData.push(staffRowArray);
        console.log(staffRowArray[38]);
    })

    console.log('len ' + staffData.length);

    //sort the data
    staffData.sort((a, b) => {
    if (a[37] > b[37]) {
      return 1;
    }
    if (a[37] < b[37]) {
      return -1;
    }
    return 0;
  });

    console.log(staffData[0]);

}

displayTopTeachingData(20);