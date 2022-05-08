const fs = require('fs');
const htmlFunctions = require('../local-modules/html-functions');
const puppeteer = require('puppeteer');
const yargs = require("yargs");
const { runMain } = require('module');
const globalSettings = require('../local-modules/report-settings');
const REPORTS_DATA_FOLDER = globalSettings.getReportsFolder();

function getTimestamp() {
  let date_ob = new Date();

  // adjust 0 before single digit date
  let date = ("0" + date_ob.getDate()).slice(-2);

  // current month
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

  // current year
  let year = date_ob.getFullYear();

  // current hours
  let hours = date_ob.getHours();

  // current minutes
  let minutes = date_ob.getMinutes();

  // current seconds
  let seconds = date_ob.getSeconds();

  // prints date & time in YYYY-MM-DD HH:MM:SS format
  var timestamp = year + "-" + month + "-" + date + "-" + hours + "-" + minutes + "-" + seconds;
  return timestamp;
}


function performStaffProfileDiff(domain) {

  var DATE_TODAY = globalSettings.getTimestamp('today', 'yymmdd');
  var DATE_YESTERDAY = globalSettings.getTimestamp('yesterday', 'yymmdd');


  const previous = '../../reports-data/staff-profile/field-progress/csv/staff-profile-field-index-' + DATE_YESTERDAY + '.csv';
  //const previous = '../../reports-data/staff-profile/field-progress/csv/staff-profile-field-index-20220228.csv';
  //const previous = '../../reports-data/staff-profile/field-progress/csv/staff-profile-data-index-at-launch.csv';
  //const current = '../../reports-data/staff-profile/field-progress/csv/staff-profile-field-index-20220111.csv';
  const current = '../../reports-data/staff-profile/field-progress/csv/staff-profile-field-index-' + DATE_TODAY + '.csv';
  //const current = '../../reports-data/staff-profile/field-progress/csv/staff-profile-field-index-20220301.csv';
  //const previous = '../reports/progress/staff-profile-data-28-11-21.csv';
  //const current = '../reports/progress/staff-profile-data-09-12-21.csv';
  var newStaffProfiles = [];
  //newStaffProfiles.push(['Person URL', 'Person name', 'Data fields completed']);
  var removedStaffProfiles = [];
  //removedStaffProfiles.push(['Person URL', 'Person name']);

  var previousList = fs.readFileSync(previous).toString().split("\n");
  var currentList = fs.readFileSync(current).toString().split("\n");

  currentList.forEach(currentRow => {
    var currentRowArray = currentRow.split(',');
    var currentRowURL = currentRowArray[0];
    var currentRowName = currentRowArray[28];
    var currentRowEmail = currentRowArray[32];
    var currentRowFieldIndex = currentRowArray[2];
    var currentRowUsername = currentRowArray[36];

    originalCurrentRowURL = currentRowURL;
    //currentRowURL = currentRowURL.replace('oneweb.pprd.soton.ac.uk', 'oneweb.soton.ac.uk')

    var found = false;
    previousList.forEach(previousRow => {
      var previousRowArray = previousRow.split(',');
      var previousRowURL = previousRowArray[0];

      if (currentRowURL == previousRowURL) {
        found = true;
        return;
      }
    })

    if (!found) {
      newStaffProfiles.push([originalCurrentRowURL, currentRowName, currentRowFieldIndex, currentRowEmail, currentRowUsername]);
    }
  })

  previousList.forEach(previousRow => {
    var previousRowArray = previousRow.split(',');
    var previousRowURL = previousRowArray[0];
    var previousRowName = previousRowArray[28];
    var previousRowEmail = previousRowArray[32];
    var previousRowFieldIndex = previousRowArray[2];
    var previousRowUsername = previousRowArray[36];

    if (previousRowUsername.length > 10) {
      previousRowUsername = '';
    }

    var found = false;
    currentList.forEach(currentRow => {
      var currentRowArray = currentRow.split(',');
      var currentRowURL = currentRowArray[0];

      // currentRowURL = currentRowURL.replace('oneweb.pprd.soton.ac.uk', 'oneweb.soton.ac.uk')

      if (currentRowURL == previousRowURL) {
        found = true;
        return;
      }
    })



    if (!found) {

      //previousRowURL = previousRowURL.replace('oneweb.soton.ac.uk', 'oneweb.pprd.soton.ac.uk');
      removedStaffProfiles.push([previousRowURL, previousRowName, previousRowFieldIndex.toString(), previousRowEmail, previousRowUsername]);
    }
  })

  let previousURL = '';
  let currentDataDuplicates = [];

  //find duplicates
  currentList.forEach(currentRow => {

    var currentRowArray = currentRow.split(',');
    //console.log(currentRowArray[0]);

    if (currentRowArray[0] == previousURL) {
      currentDataDuplicates.push([currentRowArray[0]]);
    }

    previousURL = currentRowArray[0];

  })

  //setup today's data and time for the report
  var today = new Date();
  today = today.toDateString() + ' ' + today.toLocaleTimeString();
  var DATE_TODAY = globalSettings.getTimestamp('today', 'yymmdd');

  //sort the data
  removedStaffProfiles.sort((a, b) => {
    if (a[1] > b[1]) {
      return 1;
    }
    if (a[1] < b[1]) {
      return -1;
    }
    return 0;
  });

  newStaffProfiles.unshift(['Person URL', 'Person name', 'Fields with data', 'Person username']);
  removedStaffProfiles.unshift(['Person URL', 'Person name', 'Fields with data', 'Person email (if made public in IDM)', 'Person username']);
  currentDataDuplicates.unshift(['Person URL']);

  //count the data 
  //! this is bad 

  var staffProfilesAddedCount = newStaffProfiles.length - 1;
  var staffProfilesRemovedCount = removedStaffProfiles.length - 1;
  var staffProfilesDuplicateCount = currentDataDuplicates.length - 1;
  var currentListCount = currentList.length - 1;
  var previousListCount = previousList.length - 1;

  //update the console

  console.log('Staff profiles added : ' + staffProfilesAddedCount);
  console.log('Staff profiles removed : ' + staffProfilesRemovedCount);
  console.log('Staff profiles duplicated : ' + staffProfilesDuplicateCount);

  //console.log('Removed');
  //console.log(removedStaffProfiles);

  //console.log('Added');
  //console.log(newStaffProfiles);

  //console.log('Duplicates');
  //console.log(currentDataDuplicates);

  //read in latest data 
  //data schema 
  //date,total,added,removed
  var dataFile = 'data-diff-history.csv';
  var progressData = fs.readFileSync(dataFile).toString().split("\n");
  var progressDataArray = [];
  progressData.forEach(element => {
    var data = element.split(',');
    if (data.length > 1) {
      progressDataArray.push([data[0], data[1], data[2], data[3]]);
    }
  });

  //add latest data
  progressDataArray.push([DATE_TODAY, currentListCount.toString(), staffProfilesAddedCount.toString(), staffProfilesRemovedCount.toString()]);

  console.log(progressDataArray);

  progressDataArray.sort(function (b, a) {
    return a[0] - b[0];
  })


  //write the datafile out with latest data
  var csv = progressDataArray.map(function (d) {
    return d.join();
  }).join('\n');
  fs.writeFileSync(dataFile, csv);

  //build graph data
  var graphLabels = [];
  var graphTotals = [];
  var graphAdditions = [];
  var graphRemovals = [];

  progressDataArray.forEach(element => {

    //var data = element.split(',');
    var data = element;
    console.log('element ' + element);

    var date = data[0];
    var total = data[1];
    var additions = data[2];
    var removals = data[3];

    graphLabels.push(date);
    graphTotals.push(parseInt(total));
    graphAdditions.push(parseInt(additions));
    graphRemovals.push(parseInt(removals));
  });

  console.log('labels ' + graphLabels);
  console.log('totals ' + graphTotals);
  console.log('adds ' + graphAdditions);
  console.log('remove ' + graphRemovals);



  //modify data in table below to include a href link
  progressDataArray.forEach(element => {
    element[0] = '<a href="staff-profile-data-diff-' + element[0] + '.html' + '" target="_blank"> ' + element[0] + '</a';
  });



  //add a header to the data array
  progressDataArray.unshift(['Date', 'Total', 'Additions', 'Removals']);

  //create html report
  var htmlReport = '';
  htmlReport = '<html><head>';
  htmlReport += `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital UX Team - Staff Profile Dashboard</title>
    <!--Chart.js JS CDN-->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" type="text/css" href="../../../../../css/dux-dashboard.css" />
    <link
      rel="icon"
      href="http://dux.soton.ac.uk/drupal-reports/favicon/favicon.ico"
    />`;
  htmlReport += '<header id="mainheader"> <div class="container"> <h1>Digital UX Team - Staff profile difference report</h1></div></header>';
  htmlReport += '<section class="mainsection">';
  //htmlReport += '<br>';
  //htmlReport += '<hr>';
  htmlReport += '<h2>Summary</h2>';
  htmlReport += '<div id="reportdate">Dashboard last updated on ' + today + '.</div>';
  htmlReport += '<div>Comparing:</div>';
  htmlReport += '<div><ul><li>' + currentListCount + ' profiles in <b>latest</b> (' + current + ')';
  htmlReport += '<li>' + previousListCount + ' profiles in <b>previous</b> (' + previous + ')</ul></div>';
  htmlReport += '<div>Results:</div>';
  htmlReport += '<div><ul><li>' + staffProfilesAddedCount + ' <a href="#added"> staff profiles have been ADDED </a>';
  htmlReport += '<li>' + staffProfilesRemovedCount + ' <a href="#removed"> staff profiles have been REMOVED </a>';
  htmlReport += '<li>' + staffProfilesDuplicateCount + ' <a href="#duplicate"> staff profiles are duplilcated </a></ul></div>';
  //htmlReport += '<hr>';
  //htmlReport += '<h2 id="added">Staff profiles ADDED to since previous report</h2>';
  htmlReport += '<h2 id="added">Staff profiles ADDED </h2>';
  htmlReport += '<div>' + staffProfilesAddedCount + ' staff profiles have been added </div>';
  //htmlReport += '<br>';
  htmlReport += htmlFunctions.generateTable(newStaffProfiles);
  //htmlReport += '<hr>';
  htmlReport += '<h2 id="removed"> Staff profiles REMOVED</h2>';
  htmlReport += '<div>' + staffProfilesRemovedCount + ' staff profiles have been REMOVED </div>';
  //htmlReport += '<br>';
  htmlReport += htmlFunctions.generateTable(removedStaffProfiles);
  //htmlReport += '<hr>';
  htmlReport += '<h2 id="duplicate">Staff profiles duplicated in current set </h2>';
  htmlReport += '<div>' + staffProfilesDuplicateCount + ' profiles are duplicated</div>';
  //htmlReport += '<br>';
  htmlReport += htmlFunctions.generateTable(currentDataDuplicates);
  //htmlReport += '<hr>';
  htmlReport += '</body></html>';
  fs.writeFileSync('../../reports-data/staff-profile/data-diff/html/staff-profile-data-diff-' + DATE_TODAY + '.html', htmlReport);
  fs.writeFileSync('../../reports-data/staff-profile/data-diff/html/staff-profile-data-diff.html', htmlReport);

  //create progress chart
  var staffTotalsChart = 'staffTotalsChart';
  var staffAdditionsChart = 'staffAdditionsChart';
  var staffRemovalsChart = 'staffRemovalsChart';

  //create an array of strings for lables
  var graphLabelsStrings = [];
  graphLabels.forEach(element => {
    if (element.length > 0) {
      graphLabelsStrings.push('"' + element.substring(4) + '"');
    }
  });


  htmlReport = '<html><head>';
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
    <title>Digital UX Team - Staff Profile Dashboard</title>
    <!--Chart.js JS CDN-->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" type="text/css" href="../../../../../css/dux-dashboard.css" />
    <link
      rel="icon"
      href="http://dux.soton.ac.uk/drupal-reports/favicon/favicon.ico"
    />`;



  htmlReport += '</head><body>';

  htmlReport += '<header id="mainheader"> <div class="container"> <h1>Digital UX Team - Staff profile totals, additions and removals</h1></div></header>';
  htmlReport += '<section class="mainsection">';
  htmlReport += '<div id="menu-cta"><a href="../../../../../faculty-readiness-dashboard/index.html"> <i class="fa fa-arrow-left" style="font-size:20px;color:#0074d9;"></i>&nbsp;&nbsp;Product dashboard</a></div>';
  //htmlReport += '<br>';

  //htmlReport += '<hr>';

  htmlReport += '<h2 id="added">Staff profiles totals </h2>';
  htmlReport += '<div id="reportdate">Dashboard last updated on ' + today + '.</div>';
  //htmlReport += '<br>';
  htmlReport += '<div><div class="chart-container"> <canvas id="' + staffTotalsChart + '"style="float:left;" style="max-height:200px;" style="max-width:200px;"></canvas></div></div>';

  //htmlReport += '<hr>';
  htmlReport += '<h2 id="added">Staff profiles additions </h2>';
  //htmlReport += '<br>';
  htmlReport += '<div><div class="chart-container"> <canvas id="' + staffAdditionsChart + '" style="float:right;" style="height:75%;max-height:600" style="width:50%"></canvas></div></div>';

  //htmlReport += '<hr>';
  htmlReport += '<h2 id="added">Staff profiles removals </h2>';
  //htmlReport += '<br>';
  htmlReport += '<div><div class="chart-container"> <canvas id="' + staffRemovalsChart + '" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas></div></div>';
  //htmlReport += '<hr>';
  htmlReport += '<h2>Summary</h2>';
  htmlReport += '<div>Summary of daily staff profile totals, additions and removals</div>';
  //htmlReport += '<br>';
  htmlReport += htmlFunctions.generateTable(progressDataArray);
  //htmlReport += '<hr>';


  //create staff totals chart
  htmlReport += createLineChart(staffTotalsChart, graphLabelsStrings, graphTotals, 'NUMBER OF LIVE STAFF PROFILES', 'Number of profiles public in Subscribe');
  htmlReport += createLineChart(staffAdditionsChart, graphLabelsStrings, graphAdditions, 'NUMBER OF PROFILES ADDED EVERY DAY', 'Number of new profiles added (public in Subscribe)');
  htmlReport += createLineChart(staffRemovalsChart, graphLabelsStrings, graphRemovals, 'NUMBER OF PROFILES REMOVED EVERY DAY', 'Number of profiles removed (private in Subscribe, leaver)');

  //htmlReport += '<hr>';
  htmlReport += '</section>';
  htmlReport += `<footer id="mainfooter">
  <p>
  Use the weekly delivery clinics (Wednesday, 10:15) with DUX, ADOFOS and
  FOS teams for help with the dashboard. &nbsp;Contact
  <a
    href="mailto:paul.thwaite@soton.ac.uk?subject=Please invite me to a delivery clinic"
    >Paul Thwaite</a
  >
  to attend a clinic.
</p>
<p>
  Found a bug? &nbsp; Please
  <a
    href="http://dux.soton.ac.uk/faculty-readiness-dashboard/report-a-bug.html"
    >report it on the bug report
  </a>
  page.
</p>
    </footer>`;
  htmlReport += ' </body></html>';
  fs.writeFileSync('../../reports-data/staff-profile/data-diff/html/staff-profile-progress-charts-' + DATE_TODAY + '.html', htmlReport);
  fs.writeFileSync('../../reports-data/staff-profile/data-diff/html/staff-profile-progress-charts.html', htmlReport);

}


function createLineChart(CHARTNAME, LABELS, DATA, TITLE, SUBTITLE) {

  let chartHTML = `<script>
        var ctx = document.getElementById('${CHARTNAME}').getContext('2d');

  var CHART_COLORS = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
  };

  var data = {
    labels: [${LABELS}],
    datasets: [
      {
        label: 'STAFF PROFILES ADDED',
        data: [${DATA}],
        backgroundColor: CHART_COLORS.blue,
      },
    ]
};

var myChart = new Chart(ctx, {
  type: 'line',
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
        text: '${SUBTITLE}',
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
              },
  y: {
    stacked: true
  }
}
          }
        })
      </script>`;

  return chartHTML;

}



function createStaffProfileFacultyReport() {

  const ART_FACULTY = 'Faculty of Arts and humanities';
  const ENG_FACULTY = 'Faculty of Engineering and Physical Sciences';
  const ENV_FACULTY = 'Faculty of Environmental and Life Sciences';
  const MED_FACULTY = 'Faculty of Medicine';
  const SOC_FACULTY = 'Faculty of Social Sciences';

  const FACULTY = [ART_FACULTY, ENG_FACULTY, ENV_FACULTY, MED_FACULTY, SOC_FACULTY];
  const SCHOOL = ['School 1', 'School 2', 'School 3', 'School 4', 'School 5', 'School 6', 'School 7', 'School 8', 'School 9', 'School 10', 'School 11', 'School 12'];
  const DEPARTMENT = ['Department A', 'Department B', 'Department C', 'Department D', 'Department E', 'Department F', 'Department G', 'Department H', 'Department I', 'Department J', 'Department K', 'Department L'];

  const STAFF_DATA = '../reports/progress/staff-profile-data-field-index-prod-2021-12-17.csv';
  var staffProfileData = fs.readFileSync(STAFF_DATA).toString().split("\n");

  console.log(staffProfileData.length);
  staffProfileData.splice(0, 2);
  console.log(staffProfileData.length);
  console.log(staffProfileData[0]);


  var staffProfileDataWithFaculties = [];

  //add faculty info to the array
  staffProfileData.forEach(profile => {

    var faculty = FACULTY[Math.floor(Math.random() * FACULTY.length)];
    var school = SCHOOL[Math.floor(Math.random() * SCHOOL.length)];
    var department = DEPARTMENT[Math.floor(Math.random() * DEPARTMENT.length)];

    var profileArray = profile.split(',');
    profileArray[34] = faculty;
    profileArray[35] = school;
    profileArray[36] = department;

    staffProfileDataWithFaculties.push([profileArray]);
  })

  console.log(staffProfileDataWithFaculties.length);

  //Faculty of Arts and humanities
  var artsSchool = [];
  var artsDepartment = [];
  var artsCount = 0;

  //Faculty of Engineering and Physical Sciences
  var engSchool = [];
  var engDepartment = [];
  var engCount = 0;

  //Faculty of Environmental and Life Sciences
  var envSchool = [];
  var envDepartment = [];
  var envCount = 0;

  //Faculty of Medicine
  var medSchool = [];
  var medDepartment = [];
  var medCount = 0;

  //Faculty of Social Sciences
  var socSchool = [];
  var socDepartment = [];
  var socCount = 0;

  var facultyReportData = [];


  staffProfileDataWithFaculties.forEach(profile => {

    var faculty = profile[0][34];
    var school = profile[0][35];
    var department = profile[0][36];
    //facultyList.push(faculty);

    if (faculty == ART_FACULTY) {

      artsSchool.push(school);
      artsDepartment.push(department);
      artsCount++;
    }

    if (faculty == ENG_FACULTY) {

      engSchool.push(school);
      engDepartment.push(department);
      engCount++;
    }

    if (faculty == ENV_FACULTY) {

      envSchool.push(school);
      envDepartment.push(department);
      envCount++;
    }

    if (faculty == MED_FACULTY) {

      medSchool.push(school);
      medDepartment.push(department);
      medCount++;
    }

    if (faculty == SOC_FACULTY) {

      socSchool.push(school);
      socDepartment.push(department);
      socCount++;
    }

    if (facultyReportData[faculty] == undefined) {
      facultyReportData[faculty] = [];
    }

    if (facultyReportData[faculty][school] == undefined) {
      facultyReportData[faculty][school] = [];
    }

    if (facultyReportData[faculty][school][department] == undefined) {
      facultyReportData[faculty][school][department] = [];
    }

    facultyReportData[faculty][school][department].push([profile]);
  })

  //setup html reports 
  artProfiles = [];

  //remove duplicates
  artsSchool = [...new Set(artsSchool)];
  artsDepartment = [...new Set(artsDepartment)];
  engSchool = [...new Set(engSchool)];
  engDepartment = [...new Set(engDepartment)];
  envSchool = [...new Set(envSchool)];
  envDepartment = [...new Set(envDepartment)];
  medSchool = [...new Set(medSchool)];
  medDepartment = [...new Set(medDepartment)];
  socSchool = [...new Set(socSchool)];
  socDepartment = [...new Set(socDepartment)];

  generateHTMLReport(facultyReportData, ART_FACULTY, artsSchool, artsDepartment, artsCount);
  generateHTMLReport(facultyReportData, ENG_FACULTY, engSchool, engDepartment, engCount);
  generateHTMLReport(facultyReportData, ENV_FACULTY, envSchool, envDepartment, envCount);
  generateHTMLReport(facultyReportData, MED_FACULTY, medSchool, medDepartment, medCount);
  generateHTMLReport(facultyReportData, SOC_FACULTY, socSchool, socDepartment, socCount);




  /*
  var artHTMLReport = setupHTMLReport(ART_FACULTY);

  artHTMLReport += 'Jump to school : ';
  artsSchool.forEach(school => {

      var schoolText = school.replace(/\s/g, "-");
      artHTMLReport += '<a href="#' + schoolText + '"> ' + school + '</a>';
      artHTMLReport += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
  })
  artHTMLReport += '<br>';


  artsSchool.forEach(school => {

      var schoolText = school.replace(/\s/g, "-");
      artHTMLReport += '<h2 id="' + schoolText + '"> ' + school + '</h2>';

      artsDepartment.forEach(department => {
          artHTMLReport += '<h3> ' + department + '</h3>';
          artHTMLReport += '<br>';

          if (facultyReportData[ART_FACULTY][school][department] != undefined) {

              var data = facultyReportData[ART_FACULTY][school][department];
              var profileData = [];
              profileData.push(['Staff member name', 'Fields with data', 'Photo', 'Name', 'Title', 'Research interests', 'Accepting PhD students', 'Email', 'Telephone', 'Address', 'Google scholar', 'ORCID', 'LinkedIn', 'Twitter', 'About', 'Research groups', 'Research interests', 'Current research', 'Research projects active', 'Research projects completed', 'Publications', 'Supervision current', 'Supervision previous', 'Teaching intro', 'Teaching modules', 'Roles', 'Biography', 'Prizes']);
              data.forEach(element => {
                  var theProfile = element.toString().split(',');
                  theProfile = modifyColumns(theProfile);
                  profileData.push(theProfile);
                  artProfiles.push([theProfile]);
              });
              artHTMLReport += htmlFunctions.generateTable(profileData);
              artHTMLReport += '<br>';
          }
      })
  })
  
  //create a graph
  artHTMLReport += countDataFields(artProfiles, ART_FACULTY);

  //save the html file
  artHTMLReport += '</body></html>';
  fs.writeFileSync('../reports/staff-profile-faculty-progress-report/html/staff-profile-progress-report.html', artHTMLReport);

  */

}


function generateHTMLReport(facultyReportData, faculty, schools, departments, profileCount) {
  var htmlReport = setupHTMLReport(faculty);

  htmlReport += '<div id="jumptotop"</div>';
  htmlReport += '<h2>Detailed readiness by staff member</h2>';
  htmlReport += '<div>The ' + faculty + ' has ' + profileCount + ' staff profiles. </div>';
  htmlReport += '<br>';
  htmlReport += '<div>The tables below illustrate the current state of individual staff profile pages. </div>';
  htmlReport += '<br>';
  htmlReport += '<div>The report identifies which fields contain data for each member of staff in your faculty. The report is broken down by school and department. </div>';
  //htmlReport += '<br>';
  htmlReport += '<ul><li>YES = data exists on the person\'s staff profile page. ';
  htmlReport += '<li>NO = data does not exist on the person\'s staff profile page.  The staff member needs to update their profile using the instructions above. </ul>';
  //htmlReport += '<br>';
  htmlReport += '<br>';
  htmlReport += '<div id="jumptotop"</div>';
  htmlReport += 'Jump to school : ';
  schools.forEach(school => {

    var schoolText = school.replace(/\s/g, "-");
    htmlReport += '<a href="#' + schoolText + '">' + school + '</a>';
    //htmlReport += '&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;';
    htmlReport += '&nbsp;&nbsp;|&nbsp;&nbsp;';
  })
  htmlReport += '<br><br>';

  htmlReport += 'Jump to department : ';
  departments.forEach(department => {

    var schoolText = department.replace(/\s/g, "-");
    htmlReport += '<a href="#' + schoolText + '">' + department + '</a>';
    //htmlReport += '&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;';
    htmlReport += '&nbsp;&nbsp;|&nbsp;&nbsp;';
  })
  htmlReport += '<br><br>';

  var artProfiles = [];

  var count = 0;
  schools.forEach(school => {

    var schoolText = school.replace(/\s/g, "-");
    htmlReport += '<h3 id="' + schoolText + '"> ' + school + '</h3>';

    departments.forEach(department => {
      var departmentText = department.replace(/\s/g, "-");
      htmlReport += '<h4 id="' + departmentText + '"> ' + department + '</h4>';
      htmlReport += '<div><a href="#jumptotop">Jump to top</a></div>';
      htmlReport += '<br>';

      if (facultyReportData[faculty][school][department] != undefined) {

        var data = facultyReportData[faculty][school][department];
        var profileData = [];
        profileData.push(['Staff member name', 'Fields with data', 'Photo', 'Name', 'Title', 'Research interests', 'Accepting PhD students', 'Email', 'Telephone', 'Address', 'Google scholar', 'ORCID', 'LinkedIn', 'Twitter', 'About', 'Research groups', 'Research interests', 'Current research', 'Research projects active', 'Research projects completed', 'Publications', 'Supervision current', 'Supervision previous', 'Teaching intro', 'Teaching modules', 'Roles', 'Biography', 'Prizes']);
        data.forEach(element => {
          var theProfile = element.toString().split(',');
          theProfile = modifyColumns(theProfile);
          profileData.push(theProfile);
          artProfiles.push([theProfile]);
          count++;
        });
        htmlReport += htmlFunctions.generateTable(profileData);
        htmlReport += '<br>';
      }
    })
  })

  console.log('count = ' + count);

  //create a graph
  console.log(artProfiles.length);
  htmlReport += countDataFields(artProfiles, faculty);

  //save the html file
  htmlReport += '</body></html>';
  var facultyText = faculty.replace(/\s/g, "-");
  //fs.writeFileSync('../reports/staff-profile-faculty-progress-report/html/staff-profile-progress-report-' + facultyText + '.html', htmlReport);

}


function countDataFields(staffProfileDataWithFaculties, faculty) {

  const ART_FACULTY = 'Faculty of Arts and humanities';
  const ENG_FACULTY = 'Faculty of Engineering and Physical Sciences';
  const ENV_FACULTY = 'Faculty of Environmental and Life Sciences';
  const MED_FACULTY = 'Faculty of Medicine';
  const SOC_FACULTY = 'Faculty of Social Sciences';

  const FACULTY = [ART_FACULTY, ENG_FACULTY, ENV_FACULTY, MED_FACULTY, SOC_FACULTY];

  const STAFF_DATA = '../reports/progress/staff-profile-data-field-index-prod-2021-12-17.csv';
  var staffProfileData = fs.readFileSync(STAFF_DATA).toString().split("\n");

  var facultyDataCountYes = [];
  var facultyDataCountNo = [];

  for (let row = 0; row < staffProfileDataWithFaculties.length; row++) {
    const theRow = staffProfileDataWithFaculties[row][0];

    if (faculty == ART_FACULTY) {
      console.log(theRow);
    }

    //console.log(theRow);
    //console.log(theRow[0]);
    //console.log(theRow[1]);
    //console.log(theRow[2]);
    //console.log(theRow[3]);
    //console.log(theRow[4]);

    for (let column = 2; column < 29; column++) {
      const theColumn = theRow[column];




      if (facultyDataCountYes[column - 2] == undefined) {
        facultyDataCountYes[column - 2] = 0;
      }

      if (facultyDataCountNo[column - 2] == undefined) {
        facultyDataCountNo[column - 2] = 0;
      }

      if (theColumn == 'YES') {

        facultyDataCountYes[column - 2]++;
      }

      if (theColumn == 'NO') {

        facultyDataCountNo[column - 2]++;

      }
    };
  };



  console.log(facultyDataCountYes);
  console.log(facultyDataCountNo);

  const LABELS = "['Photo', 'Name', 'Title', 'Research interests', 'Accepting PhD students', 'Email', 'Telephone', 'Address', 'Google scholar', 'ORCID', 'LinkedIn', 'Twitter', 'About', 'Research groups', 'Research interests', 'Current research', 'Research projects active', 'Research projects completed', 'Publications', 'Supervision current', 'Supervision previous', 'Teaching intro', 'Teaching modules', 'Roles', 'Biography', 'Prizes']";
  const TOTAL = staffProfileDataWithFaculties.length;
  const TITLE = "STAFF PROFILE PROGRESS FOR " + faculty.toUpperCase() + ' - ' + TOTAL + ' PROFILES';


  let graphHTML = `
  < script >
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
      data: [${facultyDataCountYes}],
      backgroundColor: CHART_COLORS.blue,
    },
    //{
    //  label: 'DATA FIELD EMPTY',
    //  data: [${facultyDataCountNo}],
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
        text: 'Data fields completed across faculty (where Subscribe profile is public)',
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
      </script > `

  return graphHTML;
}



function modifyColumns(profile) {


  // console.log(profile[29]);

  var personURL = profile[0];
  var personNameValue = profile[29];
  var personDataCount = profile[2];
  var personPhoto = profile[3];
  var personName = profile[4];
  var personTitle = profile[5];
  var personResearchInterestsHero = profile[6];
  var personPhDStudents = profile[7];
  var personEmail = profile[8];
  var personTelephone = profile[9];
  var personAddress = profile[10];
  var personGoogleScholar = profile[11];
  var personORCID = profile[12];
  var personLinkedIn = profile[13];
  var personTwitter = profile[14];
  var personAbout = profile[15];
  var personResearchGroups = profile[16];
  var personResearchInterests = profile[17];
  var personResearchCurrent = profile[18];
  var personResearchProjectsActive = profile[19];
  var personResearchProjectsCompleted = profile[20];
  var personPublications = profile[21];
  var personSupervisionCurrent = profile[22];
  var personSupervisionPrevious = profile[23];
  var personTeachingIntro = profile[24];
  var personTeachingModules = profile[25];
  var personRoles = profile[26];
  var personBiography = profile[27];
  var personPrizes = profile[28];

  var newPersonURL = '<a href="' + personURL + '" target="_blank"> ' + personNameValue + '</a';

  profileArray = [];
  profileArray.push(newPersonURL, personDataCount.toString(), personPhoto, personName, personTitle, personResearchInterestsHero, personPhDStudents, personEmail, personTelephone, personAddress, personGoogleScholar, personORCID, personLinkedIn, personTwitter, personAbout, personResearchGroups, personResearchInterests, personResearchCurrent, personResearchProjectsActive, personResearchProjectsCompleted, personPublications, personSupervisionCurrent, personSupervisionPrevious, personTeachingIntro, personTeachingModules, personRoles, personBiography, personPrizes);
  return profileArray;
}



function setupHTMLReport(faculty) {

  //setup today's data and time for the report
  var today = new Date();
  today = today.toDateString() + ' ' + today.toLocaleTimeString();
  var timestamp = getTimestamp();

  var htmlReport = '';
  htmlReport += '<html><head>';
  htmlReport += `< style >
  table,
  th,
  td {
  border: 1px solid black;
  border - collapse: collapse;
  border - color: #808080;
}
  
            table {
  width: 130 %;
}

table.fixed {
  table - layout: fixed;
}

td: nth - child(1) {
  width: 12 %;
}
  
        </style >

  <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Staff profile data field analysis</title>
      <!--Chart.js JS CDN-->
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`;


  htmlReport += '</head><body>';
  htmlReport += '<h1>Digital UX - Staff profile readiness report - ' + faculty + '</h1>';
  //htmlReport += '<br>';
  //htmlReport += '<h2>Report date : ' + today + '</h2>';
  htmlReport += '<div>Report date : ' + today + '</div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>How to use this report</h2>';
  htmlReport += '<div>The new staff profile is driven by data from source systems \'Subscribe\' and \'Pure\'.  Staff members update these source systems and the data automatically displays on their staff profile page.  </div>';
  htmlReport += '<br>';
  htmlReport += '<div>A staff profile page is made up of 26 data fields. The report identifies which fields contain data for each member of staff in your faculty. The report is broken down by school and department. </div>';
  htmlReport += '<br>';
  htmlReport += '<div>The report will only show members of staff who have made their \'Subscribe\' profile public.  If staff members are missing from the report, please ask them to follow the <a href="https://sotonac.sharepoint.com/teams/staff-profile-guidance#how-to-create-your-new-profile" target="_blank" > how to create your new profile</a> instructions on the staff profile guidance Sharepoint site.</div>';
  htmlReport += '<br>';
  htmlReport += '<div>Use the report to identify the current progress of your faculty\'s readiness for staff profile rollout.   </div>';
  htmlReport += '<br>';
  htmlReport += '<div>Please note:</div>';
  htmlReport += '<div><ul>';
  htmlReport += '<li>Not all data fields will apply to every staff member. For example, some staff members will not use or need a Twitter account and it is therefore okay for the Twitter data field to be empty. ';
  htmlReport += '<li>The report lists members of staff assigned to a faculty, school and department based on data provided by HR.  It is not possible to change these assignments.';
  htmlReport += '<li>Staff members must wait up to 24 hours for changes made to \'Subscribe\' and \'Pure\' to show on their staff profile page. ';
  htmlReport += '<li>More information on the staff profile data fields and how they are updated can be found on the <a href="https://sotonac.sharepoint.com/teams/staff-profile-guidance/SitePages/add-content-staff-profile-first-time.aspx" target="_blank" > staff profile guidance</a> Sharepoint site.';
  htmlReport += '<li>The <a href="https://sotonac.sharepoint.com/teams/staff-profile-guidance" target="_blank" > staff profile guidance</a> Sharepoint site provides help and assitance needed for staff members to update their staff profile page.';
  htmlReport += '<li>This report will be updated on a weekly basis.';
  htmlReport += '</ul>';

  //htmlReport += '<div>  </div>';
  //htmlReport += '<div>  </div>';
  //htmlReport += '<div>  </div>';
  //htmlReport += '<div>     </div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>Summary of progress</h2>';
  htmlReport += '<div>The chart below illustrates your faculty\'s current staff profile readiness.  It shows the totals of data fields which contain data across all staff members in your faculty.   </div>';
  htmlReport += '<br>';
  htmlReport += '<div>Not all data fields will apply to every staff member.  Use this chart as a general guide of readiness only.  </div>';
  htmlReport += '<br>';
  htmlReport += '<div><canvas id="myChart" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas></div>';
  htmlReport += '<br>';
  htmlReport += '<hr>';

  return htmlReport;
}



const argv = yargs
  .options("domain", {
    alias: "d",
    description: "Drupal domain to use (prod, pprd, dev, live, other",
    type: "string",
  })
  .options("gebug", {
    alias: "g",
    description: "Turn on page debugger",
    type: "string"
  })
  .default("f", '')
  .default("gebug", 'false')
  .demandOption(["domain"], "Please specify a domain (prod, pprd, dev, live, other)")
  .help()
  .alias("help", "h").argv;

performStaffProfileDiff(argv.domain);
//createStaffProfileFacultyReport();

