const fs = require('fs');
const htmlFunctions = require('../local-modules/html-functions');
const puppeteer = require('puppeteer');
const yargs = require("yargs");
const { runMain } = require('module');
const globalSettings = require('../local-modules/report-settings');
const { getTestURLs } = require('../local-modules/site-urls');

const REPORTS_DATA_FOLDER = globalSettings.getReportsFolder();
const URL_LISTS_FOLDER = globalSettings.getUrlListsFolder();

//DATA CONST
var DATE_TODAY = globalSettings.getTimestamp('today', 'yymmdd');
var DATE_YESTERDAY = globalSettings.getTimestamp('yesterday', 'yymmdd');

//DATE_TODAY = '20220301';
//var DATE_YESTERDAY = '20211128';


//YESTERDAY_TODAY = '20220108';
//YESTERDAY_DATE = '20220108';
STAFF_PROFILE_DATA_FIELD_USAGE_AT_LAUNCH = [];
STAFF_PROFILE_DATA_AT_LAUNCH = REPORTS_DATA_FOLDER + 'staff-profile/field-progress/csv/staff-profile-field-index-20211128.csv';
STAFF_PROFILE_DATA_PREVIOUS = REPORTS_DATA_FOLDER + 'staff-profile/field-progress/csv/staff-profile-field-index-' + DATE_YESTERDAY + '.csv';
STAFF_PROFILE_DATA_LATEST = REPORTS_DATA_FOLDER + 'staff-profile/field-progress/csv/staff-profile-field-index-' + DATE_TODAY + '.csv';
STAFF_PROFILE_ADDITIONS_SINCE_LAUNCH = [];
STAFF_PROFILE_REMOVALS_SINCE_LAUNCH = [];



function performStaffProfileDiff(domain) {


  const previous = '../reports/progressgg/staff-profile-data-field-index-prod-2021-12-17.csv';
  const current = '../reports/progressggstaff-profile-data-17-12-21-pprd.csv';
  //const previous = '../reports/progress/staff-profile-data-28-11-21.csv';
  //const current = '../reports/progress/staff-profile-data-09-12-21.csv';
  var newStaffProfiles = [];
  //newStaffProfiles.push(['Person URL', 'Person name', 'Data fields completed']);
  var removedStaffProfiles = [];
  //removedStaffProfiles.push(['Person URL', 'Person name']);

  var previousList = fs.readFileSync(previous).toString().split("\n");
  var currentList = fs.readFileSync(current).toString().split("\n");
  var found;


  currentList.forEach(currentRow => {
    var currentRowArray = currentRow.split(',');
    var currentRowURL = currentRowArray[0];
    var currentRowName = currentRowArray[29];
    var currentRowFieldIndex = currentRowArray[2];

    originalCurrentRowURL = currentRowURL;
    //currentRowURL = currentRowURL.replace('oneweb.pprd.soton.ac.uk', 'oneweb.soton.ac.uk')

    found = false;
    previousList.forEach(previousRow => {
      var previousRowArray = previousRow.split(',');
      var previousRowURL = previousRowArray[0];

      if (currentRowURL == previousRowURL) {
        found = true;
        return;
      }
    })

    if (!found) {
      newStaffProfiles.push([originalCurrentRowURL, currentRowName, currentRowFieldIndex]);
    }
  })

  previousList.forEach(previousRow => {
    var previousRowArray = previousRow.split(',');
    var previousRowURL = previousRowArray[0];
    var previousRowName = previousRowArray[29];
    var previousRowEmail = previousRowArray[33];
    var previousRowFieldIndex = previousRowArray[2];

    found = false;
    currentList.forEach(currentRow => {
      var currentRowArray = currentRow.split(',');
      var currentRowURL = currentRowArray[0];

      //currentRowURL = currentRowURL.replace('oneweb.pprd.soton.ac.uk', 'oneweb.soton.ac.uk')

      if (currentRowURL == previousRowURL) {
        found = true;
        return;
      }
    })

    if (!found) {

      // previousRowURL = previousRowURL.replace('oneweb.soton.ac.uk', 'oneweb.pprd.soton.ac.uk');
      removedStaffProfiles.push([previousRowURL, previousRowName, previousRowFieldIndex.toString(), previousRowEmail]);
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
  var timestamp = getTimestamp();

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

  newStaffProfiles.unshift(['Person URL', 'Person name', 'Fields with data']);
  removedStaffProfiles.unshift(['Person URL', 'Person name', 'Fields with data', 'Person email (if made public in IDM)']);

  //count the data 
  var staffProfilesAddedCount = newStaffProfiles.length - 1;
  var staffProfilesRemovedCount = removedStaffProfiles.length - 1;

  //update the console
  console.log('Staff profiles added : ' + staffProfilesAddedCount);
  console.log('Staff profiles removed : ' + staffProfilesRemovedCount);
  console.log('Staff profiles duplicated : ' + currentDataDuplicates.length);
  console.log('\n' + currentDataDuplicates.join('\n'));

  //create html report
  var htmlReport = '';
  htmlReport += '<html><head><link rel="stylesheet" type="text/css" href="../../../../../css/dux-dashboard.css" /></head><body>';
  htmlReport += '<h1>Digital UX - Staff profile difference report</h1>';
  //htmlReport += '<br>';
  htmlReport += '<h2>Updated on ' + today + ' on the ' + domain + ' server</h2>';
  htmlReport += '<hr>';
  htmlReport += '<h2>Summary</h2>';
  htmlReport += '<div><ul><li>' + staffProfilesAddedCount + ' <a href="#added"> staff profiles have been ADDED </a>';
  htmlReport += '<li>' + staffProfilesRemovedCount + ' <a href="#removed"> staff profiles have been REMOVED </a>';
  htmlReport += '<li>' + currentDataDuplicates.length + ' <a href="#duplicate"> staff profiles are duplilcated </a></ul></div>';
  htmlReport += '<hr>';
  //htmlReport += '<h2 id="added">Staff profiles ADDED to since previous report</h2>';
  htmlReport += '<h2 id="added">Staff profiles ADDED </h2>';
  htmlReport += '<div>' + staffProfilesAddedCount + ' staff profiles have been added by the hrPostFilter</div>';
  htmlReport += '<br>';
  htmlReport += htmlFunctions.generateTable(newStaffProfiles);
  htmlReport += '<hr>';
  htmlReport += '<h2 id="removed"> Staff profiles REMOVED</h2>';
  htmlReport += '<div>' + staffProfilesRemovedCount + ' staff profiles have been REMOVED by the hrPostFilter</div>';
  htmlReport += '<br>';
  htmlReport += htmlFunctions.generateTable(removedStaffProfiles);
  htmlReport += '<hr>';
  htmlReport += '<h2 id="duplicate">Staff profiles duplicated in current set </h2>';
  htmlReport += '<div>' + currentDataDuplicates.length + ' profiles are duplicated</div>';
  htmlReport += '<br>';
  htmlReport += htmlFunctions.generateTable(currentDataDuplicates);
  htmlReport += '<hr>';
  htmlReport += '</body></html>';
  fs.writeFileSync('../reports/staff-profile-numbers-progress/html/staff-profile-progress-report-' + domain + '-' + timestamp + '.html', htmlReport);

  //create progress chart
  //progress chart data
  let LABELS = "['2 DEC', '15 DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH']";
  let PROFILE_DATA_ADDED = [0, 149];
  let PROFILE_DATA_REMOVED = [0, 108];

  //push the latest data on to the end of the array
  PROFILE_DATA_ADDED.push(staffProfilesAddedCount);
  PROFILE_DATA_REMOVED.push(staffProfilesRemovedCount);

  let profileDataAdded = [];
  let profileDataRemoved = [];

  //aggregate the data
  for (let index = 0; index < PROFILE_DATA_ADDED.length; index++) {
    const element = PROFILE_DATA_ADDED[index];

    if (index == 0) {
      profileDataAdded.push(PROFILE_DATA_ADDED[index]);
      profileDataRemoved.push(PROFILE_DATA_REMOVED[index]);
    }
    else {

      profileDataAdded.push(profileDataAdded[index - 1] + PROFILE_DATA_ADDED[index]);
      profileDataRemoved.push(profileDataRemoved[index - 1] + PROFILE_DATA_REMOVED[index]);
    }
  }

  let htmlDocument = ` <html>
    <head>
      <!-- Required meta tags -->
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Staff profile data field analysis</title>
      <!--Chart.js JS CDN-->
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
      <div>
        <canvas id="myChart" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas>
      </div>
      <script>
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
              label: 'STAFF PROFILES ADDED',
              data: [${profileDataAdded}],
              backgroundColor: CHART_COLORS.blue,
            },
            {
              label: 'STAFF PROFILES REMOVED',
              data: [${profileDataRemoved}],
              backgroundColor: CHART_COLORS.red,
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
                text: 'STAFF PROFILE PROGRESS SINCE BETA LAUNCH ON 2 DECEMBER',
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
                  text: 'Staff profiles added and removed accumalative (Subscribe user profile made public or private)',
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
      </script>
    </body>
    </html>`

  fs.writeFileSync('../reports/staff-profile-numbers-progress/graph/staff-profile-progress-graph-' + domain + '-' + timestamp + '.html', htmlDocument);
}


function createOverallProgressReport(domain) {


  const previous = STAFF_PROFILE_DATA_PREVIOUS;
  const current = STAFF_PROFILE_DATA_LATEST;
  const launch = STAFF_PROFILE_DATA_AT_LAUNCH;
  var newStaffProfiles = [];
  var removedStaffProfiles = [];

  var currentList;
  var previousList;

  //read in data
  try {
    previousList = fs.readFileSync(previous).toString().split("\n");
    currentList = fs.readFileSync(current).toString().split("\n");
  } catch (error) {
    console.log('Error loading file' + error);
    process.exit();
  }

  console.log('');
  console.log('Data for today is in ' + current);
  console.log('Data for yesterday is in ' + previous);

  currentList.forEach(currentRow => {
    var currentRowArray = currentRow.split(',');
    var currentRowURL = currentRowArray[0];
    var currentRowName = currentRowArray[29];
    var currentRowFieldIndex = currentRowArray[2];

    originalCurrentRowURL = currentRowURL;
    // currentRowURL = currentRowURL.replace('oneweb.pprd.soton.ac.uk', 'oneweb.soton.ac.uk')

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
      newStaffProfiles.push([originalCurrentRowURL, currentRowName, currentRowFieldIndex]);
    }
  })

  previousList.forEach(previousRow => {
    var previousRowArray = previousRow.split(',');
    var previousRowURL = previousRowArray[0];
    var previousRowName = previousRowArray[29];
    var previousRowEmail = previousRowArray[33];
    var previousRowFieldIndex = previousRowArray[2];

    var found = false;
    currentList.forEach(currentRow => {
      var currentRowArray = currentRow.split(',');
      var currentRowURL = currentRowArray[0];

      //currentRowURL = currentRowURL.replace('oneweb.pprd.soton.ac.uk', 'oneweb.soton.ac.uk')

      if (currentRowURL == previousRowURL) {
        found = true;
        return;
      }
    })

    if (!found) {

      //previousRowURL = previousRowURL.replace('oneweb.soton.ac.uk', 'oneweb.pprd.soton.ac.uk');
      removedStaffProfiles.push([previousRowURL, previousRowName, previousRowFieldIndex.toString(), previousRowEmail]);
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
  var timestamp = globalSettings.getTimestamp('today', 'yymmdd');

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

  newStaffProfiles.unshift(['Person URL', 'Person name', 'Fields with data']);
  removedStaffProfiles.unshift(['Person URL', 'Person name', 'Fields with data', 'Person email (if made public in IDM)']);

  //count the data 
  var staffProfilesAddedCount = newStaffProfiles.length - 1;
  var staffProfilesRemovedCount = removedStaffProfiles.length - 1;

  //update the console
  console.log('');
  console.log('');
  console.log('Staff profiles added : ' + staffProfilesAddedCount);
  console.log(newStaffProfiles.join('\n'));
  console.log('');

  console.log('Staff profiles removed : ' + staffProfilesRemovedCount);
  console.log(removedStaffProfiles.join('\n'));
  console.log('');

  console.log('Staff profiles duplicated : ' + currentDataDuplicates.length);
  console.log(currentDataDuplicates.join('\n'));
  console.log('');

  //read in latest data 
  var dataFile = 'datafile.csv';
  var progressData = fs.readFileSync(dataFile).toString().split("\n");

  //convert to arrays
  var graphLabels = [];
  var graphAdditions = [];
  var graphRemovals = [];
  var graphLabelsStrings = progressData[0].split(',');
  var graphAdditionsStrings = progressData[1].split(',');
  var graphRemovalsSrings = progressData[2].split(',');

  //convert to numbers
  graphAdditionsStrings.forEach(element => {
    graphAdditions.push(parseInt(element));
  });

  graphRemovalsSrings.forEach(element => {
    graphRemovals.push(parseInt(element));
  });

  //setup labels
  graphLabelsStrings.forEach(element => {
    graphLabels.push(element);
  });

  //push the latest data on to the end of the array
  graphAdditions.push(staffProfilesAddedCount);
  graphRemovals.push(staffProfilesRemovedCount);
  graphLabels.push(globalSettings.getTimestamp('today', 'ddmm'));

  var progressDataExport = [];
  progressDataExport.push(graphLabels);
  progressDataExport.push(graphAdditions);
  progressDataExport.push(graphRemovals);

  //write the datafile out with latest data
  var csv = progressDataExport.map(function (d) {
    return d.join();
  }).join('\n');
  fs.writeFileSync('datafile.csv', csv);

  //setup html table before adding quotes to lables
  var progressDataExportHTMLTable = htmlFunctions.generateTable(progressDataExport);

  //add quotes to labels
  for (let i = 0; i < graphLabels.length; i++) {
    graphLabels[i] = '"' + graphLabels[i] + '"';
  }

  let LABELS = '[' + graphLabels + ']';
  let PROFILE_DATA_ADDED = graphAdditions;
  let PROFILE_DATA_REMOVED = graphRemovals;

  let profileDataAdded = [];
  let profileDataRemoved = [];

  //aggregate the data
  for (let index = 0; index < PROFILE_DATA_ADDED.length; index++) {

    PROFILE_DATA_ADDED[index] = parseInt(PROFILE_DATA_ADDED[index]);
    PROFILE_DATA_REMOVED[index] = parseInt(PROFILE_DATA_REMOVED[index]);

    if (index == 0) {
      profileDataAdded.push(PROFILE_DATA_ADDED[index]);
      profileDataRemoved.push(PROFILE_DATA_REMOVED[index]);
    }
    else {

      profileDataAdded.push(profileDataAdded[index - 1] + PROFILE_DATA_ADDED[index]);
      profileDataRemoved.push(profileDataRemoved[index - 1] + PROFILE_DATA_REMOVED[index]);
    }
  }

  todayDate = globalSettings.getTimestamp('today', 'dd mmm').toUpperCase();

  //create html report
  //create html report
  var htmlReport = '';
  htmlReport += '<html><head>';
  htmlReport += `      
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital UX Team - Staff Profile Dashboard - Progress Charts</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" type="text/css" href="../../../../../css/dux-dashboard.css" />
    <link
      rel="icon"
      href="http://dux.soton.ac.uk/drupal-reports/favicon/favicon.ico"
    />`;

  htmlReport += '<header id="mainheader"> <div class="container"> <h1>Digital UX Team - Staff Profile Dashboard - Progress Charts</h1></div></header>';
  htmlReport += '<section class="mainsection">';
  //htmlReport += '<br>';
  htmlReport += '<div id="reportdate">Updated on ' + today + '</div>';
  htmlReport += '<hr>';
  //htmlReport += '<h2>Staff profiles added and removed since launch</h2>';
  //htmlReport += '<div>The new staff profile is contolled by Subscribe.  Staff members can make their Subscribe profile public to get a new staff profile.  When a Subscribe profile is made private the new staff profile is removed.   </div>';
  //htmlReport += '<br>';
  //htmlReport += '<div>This chart illustrates the total number of staff profiles added and removed since the beta launch on 2 December 2020.</div>';
  //htmlReport += '<br>';
  //htmlReport += '<div><canvas id="myChart1" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas></div>';
  //htmlReport += '<br>';
  //htmlReport += '<div>The table below shows the same data.</div>';
  //htmlReport += '<br>';
  //htmlReport += progressDataExportHTMLTable;
  //htmlReport += '<hr>';
  htmlReport += '<h2>Progress of data field completion since launch</h2>';
  htmlReport += '<div>An illustration of current data field completion of all staff profiles across all faculties since beta launch on 2 December 2021.</div>';
  //htmlReport += '<br>';
  htmlReport += '<div><canvas id="myChart2" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas></div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>Data field analysis across staff profile</h2>';
  htmlReport += '<div>An illusration of the areas of staff profile which need the most work in terms of data field completion. </div>';
  //htmlReport += '<br>';
  htmlReport += '<div><canvas id="myChart3" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas></div>';
  htmlReport += '<hr>';

  //console.log(profileDataAdded, profileDataRemoved);

  /*

  LABEL = 'STAFF PROFILE PROGRESS - 2 DEC TO ' + todayDate;

  htmlReport += `
    <script>
      var ctx = document.getElementById('myChart1').getContext('2d');
  
      const CHART_COLORS = {
        red: 'rgb(255, 99, 132)',
        orange: 'rgb(255, 159, 64)',
        yellow: 'rgb(255, 205, 86)',
        green: 'rgb(75, 192, 192)',
        blue: 'rgb(54, 162, 235)',
        purple: 'rgb(153, 102, 255)',
        grey: 'rgb(201, 203, 207)'
      };
  
      var data = {
        labels: ${LABELS},
        datasets: [
          {
            label: 'STAFF PROFILES ADDED',
            data: [${profileDataAdded}],
            backgroundColor: CHART_COLORS.blue,
          },
          {
            label: 'STAFF PROFILES REMOVED',
            data: [${profileDataRemoved}],
            backgroundColor: CHART_COLORS.red,
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
              text: '${LABEL}',
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
                text: 'Number of staff profiles added and removed (accumalative)',
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
              stacked: false,
            },
            y: {
              stacked: false
            }
          }
        }
      })
    </script>`

    */

  let chartDataYes = [];
  let chartDataNo = [];
  var data = currentList;

  for (let index = 0; index < 29; index++) {
    chartDataYes[index] = 0;
    chartDataNo[index] = 0;
  }

  for (let row = 0; row < data.length; row++) {
    const theRow = data[row].split(',');

    for (let column = 3; column < 29; column++) {
      const theColumn = theRow[column];

      if (theColumn == 'YES') {
        chartDataYes[column - 3]++;
      } else {
        chartDataNo[column - 3]++;
      }

    }
  }

  //let launchDataYes = '299,4855,3498,3,13,4855,2257,2467,16,1228,19,21,4,40,2,15,326,656,2347,0,1113,897,895,371,1,237,0,0,0';
  //let launchDataYes = '264,3153,1863,1929,12,3153,1520,276,14,1100,16,17,1,37,0,12,316,571,1936,0,0,111,110,340,53,219,0,0,0';
  let launchDataYes = '264,3153,1863,1929,12,3153,1520,276,14,1100,16,17,1,37,0,12,316,571,1936,0,111,110,340,53,219,0,0,0';  //removed supervision previous '0' 6th from 219


  LABELS = "['Photo', 'Name', 'Title', 'Research interests', 'Accepting PhD students', 'Email', 'Telephone', 'Address', 'Google scholar', 'ORCID', 'LinkedIn', 'Twitter', 'About', 'Research groups', 'Research interests', 'Current research', 'Research projects active', 'Research projects completed', 'Publications', 'Supervision current', 'Teaching interests', 'Teaching modules', 'Roles', 'Biography', 'Prizes']";



  htmlReport += `<script>
        var ctx = document.getElementById('myChart2').getContext('2d');

        const CHART_COLORS = {
          red: 'rgb(255, 99, 132)',
          orange: 'rgb(255, 159, 64)',
          yellow: 'rgb(255, 205, 86)',
          green: 'rgb(75, 192, 192)',
          blue: 'rgb(54, 162, 235)',
          purple: 'rgb(153, 102, 255)',
          grey: 'rgb(201, 203, 207)'
        };

         data = {
          labels: ${LABELS},
          datasets: [
            {
              label: 'BETA LAUNCH - 2 DEC',
              data: [${launchDataYes}],
              backgroundColor: CHART_COLORS.orange,
              stack: 'Stack 0',
            },
            {
              label: '${todayDate}',
              data: [${chartDataYes}],
              backgroundColor: CHART_COLORS.red,
              stack: 'Stack 1',
            },
          ]
        };
    
         myChart = new Chart(ctx, {
          type: 'bar',
          data: data,
          options: {
            plugins: {
                title: {
                  display: true,
                  text: 'STAFF PROFILE PROGRESS - DATA FIELD COMPLETION SINCE BETA LAUNCH',
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
                  text: 'Completeness of data-driven fields across all staff profile pages',
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
          }
        })
      </script>`




  htmlReport += `<script>
    var ctx = document.getElementById('myChart3').getContext('2d');
    
     data = {
      labels: ${LABELS},
      datasets: [
        {
          label: '${todayDate}',
          data: [${chartDataYes}],
          fill: false,
          backgroundColor:  CHART_COLORS.red,
          //backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: CHART_COLORS.red,
          //pointBackgroundColor: 'rgb(54, 162, 235)',
          //pointBorderColor: '#fff',
          //pointHoverBackgroundColor: '#fff',
          //pointHoverBorderColor: 'rgb(54, 162, 235)'
        },
      ]
    };

     myChart = new Chart(ctx, {
      type: 'radar',
      data: data,
      options: {
        plugins: {
            title: {
              display: true,
              text: 'STAFF PROFILE PROGRESS - LATEST FIELD COMPLETENESS',
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
              text: 'Completeness of data-driven fields across all staff profile pages',
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
      }
    })
  </script>`

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

  htmlReport += '</body></html>';
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/overall-progress/html/staff-profile-progress-' + timestamp + '.html', htmlReport);
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/overall-progress/html/staff-profile-progress.html', htmlReport);


}





function createStaffProfileFacultyReport() {

  const ART_FACULTY = 'Faculty of Arts and Humanities';
  const ENG_FACULTY = 'Faculty of Engineering and Physical Sciences';
  const ENV_FACULTY = 'Faculty of Environmental and Life Sciences';
  const MED_FACULTY = 'Faculty of Medicine';
  const SOC_FACULTY = 'Faculty of Social Sciences';
  const PS_FACULTY = 'Professional Services';
  const NO_FACULTY = '';
  const FACULTY_NOT_DEFINED = 'Faculty not set';
  const SCHOOL_NOT_DEFINED = 'School not set';


  //const STAFF_DATA = REPORTS_DATA_FOLDER + 'staff-profile/field-progress/csv/staff-profile-field-index-20220106.csv';
  const STAFF_DATA = STAFF_PROFILE_DATA_LATEST;

  console.log('Using ' + STAFF_DATA);

  try {
    var staffProfileData = fs.readFileSync(STAFF_DATA).toString().split("\n");

  } catch (error) {
    console.log('Error loading file : ' + error);
    process.exit();
  }

  //remove first three headers rows from the data
  staffProfileData.splice(0, 3);

  var staffProfileDataWithFaculties = staffProfileData;

  //add faculty info to the array
  /*
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
  */

  console.log('Total data size = ' + staffProfileDataWithFaculties.length);

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

  //Professional services
  var psSchool = [];
  var psDepartment = [];
  var psCount = 0;

  //No faculty 
  var undefinedSchool = [];
  var undefinedDepartment = [];
  var undefinedCount = 0;

  //list of all schools
  var allSchools = [];

  //build data of faculty, school and profiles
  var facultyReportData = [];

  //count data field usage
  var artFacultyFieldCount = 0;
  var envFacultyFieldCount = 0;
  var engFacultyFieldCount = 0;
  var medFacultyFieldCount = 0;
  var socFacultyFieldCount = 0;
  var psFacultyFieldCount = 0;
  var noFacultyFieldCount = 0;

  //assign faculties with schools with departments
  staffProfileDataWithFaculties.forEach(profile => {

    profileArray = profile.split(',');

    var faculty = profileArray[33];
    var school = profileArray[34];
    var department = profileArray[35];

    //check for empty school (with a faculty)
    if (school == '') {
      school = 'School not set';
    }

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

    if (faculty == PS_FACULTY) {

      psSchool.push(school);
      psDepartment.push(department);
      psCount++;
    }


    if (faculty == NO_FACULTY) {

      undefinedSchool.push(SCHOOL_NOT_DEFINED);
      undefinedDepartment.push('No department defined');
      undefinedCount++;
    }

    if ((faculty != NO_FACULTY) && (faculty != SOC_FACULTY) && (faculty != MED_FACULTY) && (faculty != ENV_FACULTY) && (faculty != ENG_FACULTY) && (faculty != ART_FACULTY) && (faculty != PS_FACULTY)) {
      console.log('Missing faculty --> ' + faculty);
    }

    if (faculty == NO_FACULTY) {

      if (facultyReportData[FACULTY_NOT_DEFINED] == undefined) {
        facultyReportData[FACULTY_NOT_DEFINED] = [];
      }

      if (facultyReportData[FACULTY_NOT_DEFINED][SCHOOL_NOT_DEFINED] == undefined) {
        facultyReportData[FACULTY_NOT_DEFINED][SCHOOL_NOT_DEFINED] = [];
      }

      facultyReportData[FACULTY_NOT_DEFINED][SCHOOL_NOT_DEFINED].push([profile]);


    } else {

      if (facultyReportData[faculty] == undefined) {
        facultyReportData[faculty] = [];
      }

      if (facultyReportData[faculty][school] == undefined) {
        facultyReportData[faculty][school] = [];
      }

      facultyReportData[faculty][school].push([profile]);


      //create a faculty score
      //count number of fields with a YES
      profileArray.forEach(element => {
        if (element == 'YES') {
          switch (faculty) {
            case ART_FACULTY:
              artFacultyFieldCount++;
              break;

            case ENG_FACULTY:
              engFacultyFieldCount++;
              break;

            case ENV_FACULTY:
              envFacultyFieldCount++;
              break;

            case MED_FACULTY:
              medFacultyFieldCount++;
              break;

            case SOC_FACULTY:
              socFacultyFieldCount++;
              break;

            case PS_FACULTY:
              psFacultyFieldCount++;
              break;

            case NO_FACULTY:
              noFacultyFieldCount++;
              break;
          }
        }
      })

    }

    //save school in on array
    allSchools.push(school);

  })

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
  psSchool = [...new Set(psSchool)];
  psDepartment = [...new Set(psDepartment)];
  undefinedSchool = [...new Set(undefinedSchool)];
  undefinedDepartment = [...new Set(undefinedDepartment)];
  allSchools = [...new Set(allSchools)];

  //sort schools
  artsSchool.sort();
  engSchool.sort();
  envSchool.sort();
  medSchool.sort();
  socSchool.sort();
  psSchool.sort();
  allSchools.sort();

  //create progress score
  var staffProfileCount = artsCount + engCount + envCount + medCount + socCount + psCount + undefinedCount;
  var nuumberFields = 25;
  var totalNumberFields = staffProfileCount * nuumberFields;

  //create html reports for each faculty
  generateHTMLReport(facultyReportData, ART_FACULTY, artsSchool, artsDepartment, artsCount);
  generateHTMLReport(facultyReportData, ENG_FACULTY, engSchool, engDepartment, engCount);
  generateHTMLReport(facultyReportData, ENV_FACULTY, envSchool, envDepartment, envCount);
  generateHTMLReport(facultyReportData, MED_FACULTY, medSchool, medDepartment, medCount);
  generateHTMLReport(facultyReportData, SOC_FACULTY, socSchool, socDepartment, socCount);
  generateHTMLReport(facultyReportData, PS_FACULTY, psSchool, psDepartment, psCount);
  generateHTMLReport(facultyReportData, FACULTY_NOT_DEFINED, undefinedSchool, undefinedDepartment, undefinedCount);

  //create index page
  var facultyCount = [];
  var allSchools = [];
  allSchools.push(artsSchool);
  allSchools.push(engSchool);
  allSchools.push(envSchool);
  allSchools.push(medSchool);
  allSchools.push(socSchool);
  allSchools.push(psSchool);
  allSchools.push(undefinedSchool);


  facultyCount.push(artsCount, engCount, envCount, medCount, socCount, psCount, undefinedCount);

  createStaffProfileProgressIndexPage(facultyReportData, facultyCount, staffProfileCount, allSchools);

}


function createStaffProfileProgressIndexPage(facultyReportData, facultyCount, staffProfileCount, allSchools) {

  var ART_FACULTY = "Arts and Humanities";
  const ENG_FACULTY = "Engineering and Physical Sciences";
  const ENV_FACULTY = "Environmental and Life Sciences";
  const MED_FACULTY = "Medicine";
  const SOC_FACULTY = "Social Sciences";
  const PS_FACULTY = "Professional Services";
  const NO_FACULTY = "Faculty not set";

  console.log(facultyReportData);

  var faculties = [];
  faculties.push(ART_FACULTY);
  faculties.push(ENG_FACULTY);
  faculties.push(ENV_FACULTY);
  faculties.push(MED_FACULTY);
  faculties.push(SOC_FACULTY);
  faculties.push(PS_FACULTY);
  faculties.push(NO_FACULTY);

  var facultiesLegend = [];
  facultiesLegend.push("'" + ART_FACULTY + "'");
  facultiesLegend.push("'" + ENG_FACULTY + "'");
  facultiesLegend.push("'" + ENV_FACULTY + "'");
  facultiesLegend.push("'" + MED_FACULTY + "'");
  facultiesLegend.push("'" + SOC_FACULTY + "'");
  facultiesLegend.push("'" + PS_FACULTY + "'");
  facultiesLegend.push("'" + NO_FACULTY + "'");

  //set faculty count
  var facultyCounts = [];
  facultyCounts[ART_FACULTY] = facultyCount[0];
  facultyCounts[ENG_FACULTY] = facultyCount[1];
  facultyCounts[ENV_FACULTY] = facultyCount[2];
  facultyCounts[MED_FACULTY] = facultyCount[3];
  facultyCounts[SOC_FACULTY] = facultyCount[4];
  facultyCounts[PS_FACULTY] = facultyCount[5];
  facultyCounts[NO_FACULTY] = facultyCount[6];

  //set schools
  var schools = [];
  schools[ART_FACULTY] = allSchools[0];
  schools[ENG_FACULTY] = allSchools[1];
  schools[ENV_FACULTY] = allSchools[2];
  schools[MED_FACULTY] = allSchools[3];
  schools[PS_FACULTY] = allSchools[4];
  schools[NO_FACULTY] = allSchools[5];



  //console.log('****' + facultyReportData['Faculty of Arts and Humanities']['Faculty Central (Arts and Humanities)']);

  //console.log('####' + facultyReportData['Faculty of Arts and Humanities']['Winchester School of Art']);

  console.log('---');
  console.log(faculties[0]);
  console.log('---');
  console.log(schools[ART_FACULTY]);

  var faculty = ENV_FACULTY;

  var theSchool = schools[faculty];


  /*
  //calculate faculty field score
  //create faculty score
  //count number of fields completed (field contains YES)
  var facultyFieldCount = [];
  faculties.forEach(faculty => {
    console.log(faculty);
    var theSchool = schools[faculty];
    theSchool.forEach(school => {

      console.log(school);
      faculty = faculty.toString();
      school = school.toString();
      if (facultyReportData[faculty][school] != undefined) {
        //if ('f' == 'f') {  
        var data = facultyReportData[faculty][school];

        //console.log(data);

        data.forEach(profile => {
          var theProfile = profile[0].toString().split(',');

          theProfile.forEach(element => {
            if (element == 'YES') {
              //console.log('*');
              if (facultyFieldCount[faculty] == undefined) {
                facultyFieldCount[faculty] = 0;
              }
              facultyFieldCount[faculty]++;
            }
          });
        });
      }
    });
  });

  console.log('faculty field counts = ' + facultyFieldCount);

  var nuumberFields = 25;
  var facultyFieldScore = [];
  faculties.forEach(faculty => {

    var totalNumberFields = facultyCounts[faculty] * nuumberFields;
    facultyFieldScore.push(Math.round((facultyFieldCount[faculty] / totalNumberFields) * 100));

  });

  console.log('Faculty scores : ' + facultyFieldScore);

  //create faculty score

  */



  //setup today's data and time for the report
  var today = new Date();
  today = today.toDateString() + ' ' + today.toLocaleTimeString();

  //create html report
  var htmlReport = '';
  htmlReport += '<html><head>';
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

  htmlReport += '<header id="mainheader"> <div class="container"> <h1>Digital UX Team - Staff Profile Dashboard</h1></div></header>';
  htmlReport += '<section class="mainsection">';
  htmlReport += '<div id="reportdate">Updated on ' + today + '</div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>Staff profiles by faculty</h2>';
  //htmlReport += '<div> </div>';
  htmlReport += '<div><canvas id="myChart" style="height:50%;max-height:300" style="width:75%;max-width:300px"></canvas></div>';
  //htmlReport += '<br>';
  htmlReport += '<hr>';
  htmlReport += '<h2>Faculty progress</h2>';
  htmlReport += '<div>Select your faculty from the list below to view your faculty\'s current readiness. </div>';
  //htmlReport += '<br>';
  htmlReport += '<div>Staff profiles are grouped by faculty and school.  The faculty and school data is based on data from Pure and HR.  Some staff profiles do not have a faculty and school assigned.  These staff profiles can be found in the \'Faculty not set\' dashboard.  </div>';
  //htmlReport += '<br>';
  htmlReport += '<div>Some data fields will not apply to every staff member.  See further information in the faculty dashboard.  Use this dashboard as a general guide to staff profile readiness only.  </div>';
  htmlReport += '<ul>';
  console.log(REPORTS_DATA_FOLDER);
  htmlReport += '<li><a href="staff-profile-faculty-progress-faculty-of-arts-and-humanities.html" > Faculty of Arts and Humanities</a>';
  htmlReport += '<li><a href="staff-profile-faculty-progress-faculty-of-engineering-and-physical-sciences.html" > Faculty of Engineering and Physical Sciences</a>';
  htmlReport += '<li><a href="staff-profile-faculty-progress-faculty-of-environmental-and-life-sciences.html" > Faculty of Environmental and Life Sciences</a>';
  htmlReport += '<li><a href="staff-profile-faculty-progress-faculty-of-medicine.html" > Faculty of Medicine</a>';
  htmlReport += '<li><a href="staff-profile-faculty-progress-faculty-of-social-sciences.html" > Faculty of Social Sciences</a>';
  htmlReport += '<li><a href="staff-profile-faculty-progress-professional-services.html" > Professional Services</a>';
  htmlReport += '<li><a href="staff-profile-faculty-progress-faculty-not-set.html" > Faculty not set</a>';
  htmlReport += '</ul>';
  htmlReport += '<hr>';

  let chartTitle = 'STAFF PROFILES BY FACULTY - ' + staffProfileCount + ' PROFILES';

  htmlReport += `<script>
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
          labels: [${facultiesLegend}],
          datasets: [
            {
              label: 'NUMBER OF PROFILES BY FACULTY',
              data: [${facultyCount}],
              backgroundColor: [CHART_COLORS.blue, CHART_COLORS.red, CHART_COLORS.green, CHART_COLORS.orange, CHART_COLORS.yellow, CHART_COLORS.grey, CHART_COLORS.purple,]
            },
          ]
        };
    
        var myChart = new Chart(ctx, {
          type: 'pie',
          data: data,
          options: {
            plugins: {
              title: {
                display: true,
                text: '${chartTitle}',
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
                  text: 'Current breakdown of available staff profiles across the university\\'s faculties',
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
          }
        })
      </script>`;

  htmlReport += `<script>
        var ctx = document.getElementById('myChartPercentage').getContext('2d');
    
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
          labels: [${facultiesLegend}],
          datasets: [
            {
              label: 'NUMBER OF PROFILES BY FACULTY',
              data: [${facultyCount}],
              backgroundColor: [CHART_COLORS.blue, CHART_COLORS.red, CHART_COLORS.green, CHART_COLORS.orange, CHART_COLORS.yellow, CHART_COLORS.grey, CHART_COLORS.purple,]
            },
          ]
        };
    
        var myChart = new Chart(ctx, {
          type: 'pie',
          data: data,
          options: {
            plugins: {
              title: {
                display: true,
                text: 'STAFF PROFILES BY FACULTY',
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
                  text: 'Current breakdown of available staff profiles across the university\\'s faculties',
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
          }
        })
      </script>`;

  //save the html file
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
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/faculty-progress/html/staff-profile-faculty-progress.html', htmlReport);

  return htmlReport;
}


function generateHTMLReport(facultyReportData, faculty, schools, departments, profileCount) {

  //setup html dashboard with standard content
  var htmlReport = setupHTMLReport(faculty);

  //if 'no faculty set' sort by schood/departments
  if (faculty == 'Faculty not set') {

    facultyReportData.sort(function (a, b) {
      return b[36] - a[36];
    })
  }

  //create faculty score
  //count number of fields completed (field contains YES)
  var numberFieldsCompleted = 0;
  schools.forEach(school => {
    if (facultyReportData[faculty][school] != undefined) {
      var data = facultyReportData[faculty][school];

      data.forEach(profile => {
        var theProfile = profile[0].toString().split(',');

        theProfile.forEach(element => {
          if (element == 'YES') {
            numberFieldsCompleted++;
          }
        });
      });
    }
  });

  //create faculty score
  var nuumberFields = 25;
  var totalNumberFields = profileCount * nuumberFields;
  var facultyScore = Math.round((numberFieldsCompleted / totalNumberFields) * 100);

  console.log('Faculty ' + faculty + 'has ' + numberFieldsCompleted + ' fields completed');

  if (faculty == 'Faculty not set') {

    //add detailed section to the the html report
    htmlReport += '<div id="jumptotop"</div>';
    htmlReport += '<h2>Progress for each member of staff</h2>';
    htmlReport += '<div>The ' + faculty + ' has ' + profileCount + ' staff profiles. The overall completion of data fields is ' + facultyScore + '%. </div>';
    //htmlReport += '<br>';
    htmlReport += '<div>The dashboard identifies the fields which contain data for each member of staff. </div>';
    //htmlReport += '<br>';
    htmlReport += '<div>Use the dashboard to encourage and guide staff to update their staff profile. </div>';
    //htmlReport += '<br>';
    htmlReport += '<div>How do I read this report? </div>';
    //htmlReport += '<br>';
    htmlReport += '<ul><li>YES = the data field contains information on the staff profile ';
    htmlReport += '<li>NO = the data field is empty on the staff profile.  Guide the member of staff to update their staff profile </ul>';

  } else {


    //add detailed section to the the html report
    htmlReport += '<div id="jumptotop"</div>';
    htmlReport += '<h2>Progress for each member of staff</h2>';
    htmlReport += '<div>The ' + faculty + ' has ' + profileCount + ' staff profiles. The overall completion of data fields is ' + facultyScore + '%. </div>';
    //htmlReport += '<br>';
    htmlReport += '<div>The dashboard identifies the fields which contain data for each member of staff in your faculty. The dashboard is broken down by school. </div>';
    //htmlReport += '<br>';
    htmlReport += '<div>Use the dashboard to encourage and guide faculty staff to update their staff profile. </div>';
    //htmlReport += '<br>';
    htmlReport += '<div>How do I read this report? </div>';
    //htmlReport += '<br>';
    htmlReport += '<ul><li>YES = the data field contains information on the staff profile ';
    htmlReport += '<li>NO = the data field is empty on the staff profile.  Guide the member of staff to update their staff profile </ul>';
    //htmlReport += '<br>';
  }
  //htmlReport += '<br>';
  htmlReport += '<div id="jumptotop"</div>';
  htmlReport += '<section class="staff-profile-faculty-section">';
  htmlReport += 'Jump to school : ';

  var numberSchools = schools.length;
  var position = 0;
  schools.forEach(school => {

    var schoolText = school.replace(/\s/g, "-");
    htmlReport += '<a href="#' + schoolText + '">' + school + '</a>';
    //htmlReport += '&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;';

    if (position < numberSchools - 1) {
      htmlReport += '&nbsp;&nbsp;|&nbsp;&nbsp;';
    }
    position++;
  })
  //htmlReport += '<br><br>';

  var facultyProfiles = [];

  var count = 0;
  var missingFacultyData = []
  var tempcount = 0;

  var schoolsCount = [];
  schools.forEach(school => {

    schoolsCount[school] = facultyReportData[faculty][school].length;

  })

  console.log(schoolsCount);



  schools.forEach(school => {

    var schoolText = school.replace(/\s/g, "-");
    htmlReport += '<h3 id="' + schoolText + '"> ' + school + ' (' + schoolsCount[school] + ') </h3>';
    htmlReport += '<div id="jumptotop"><a href="#jumptotop">Jump to top</a></div>';
    //htmlReport += '<br>';

    if (facultyReportData[faculty][school] != undefined) {

      var data = facultyReportData[faculty][school];
      var profileData = [];

      profileData.push(['Staff member name', 'Person title', 'Send email', 'Fields with data', 'Photo', 'Name', 'Title', 'Research interests', 'Accepting PhD students', 'Email', 'Telephone', 'Address', 'Google scholar', 'ORCID', 'LinkedIn', 'Twitter', 'About', 'Research groups', 'Research interests', 'Current research', 'Research projects active', 'Research projects completed', 'Publications', 'Supervision current', 'Teaching interests', 'Teaching modules', 'Roles', 'Biography', 'Prizes', 'Person email']);

      data.forEach(element => {

        //create array
        var theProfile = element.toString().split(',');

        if (theProfile[0] == '') {
          console.log('AHHHHHH');
        }

        //add 
        if (faculty == 'Faculty not set') {
          missingFacultyData.push([theProfile[0], theProfile[36]]);

          if (theProfile[35] != '') {
            tempcount++;
          }
        }

        //create special array with subset of columns
        theProfile = modifyColumns(theProfile, faculty);

        //add profile to array for html tables
        profileData.push(theProfile);

        //add profile to array for graph
        facultyProfiles.push([theProfile]);

        //tally number of profiles
        count++;
      })

      //add a table array to the html report
      htmlReport += htmlFunctions.generateTable(profileData, 'staff-profile-faculty-table');
      //htmlReport += '<br>';
    }

    missingFacultyData.sort(function (a, b) {
      return b[1] - a[1];
    })
  })


  //output total number of profiles for faculty
  if (faculty == '') {
    faculty = 'Faculty not defined';
  }
  console.log(faculty + ' count = ' + count);

  //create a graph for the faculty
  htmlReport += createFacultyBarChart(facultyProfiles, faculty);

  //save the html file
  htmlReport += '<hr>';
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
    </footer>`
  htmlReport += '</body></html>';
  var facultyText = faculty.replace(/\s/g, "-");
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/faculty-progress/html/staff-profile-faculty-progress-' + facultyText.toLowerCase() + '.html', htmlReport);
}



function createFacultyBarChart(staffProfileDataWithFaculties, faculty) {

  var facultyDataCountYes = [];
  var facultyDataCountNo = [];

  const TOTAL_DATA_COUNT = staffProfileDataWithFaculties.length;

  //loop through the profile data and count the number of fields with a YES and a NO
  for (let row = 0; row < TOTAL_DATA_COUNT; row++) {
    const theRow = staffProfileDataWithFaculties[row][0];

    for (let column = 4; column < 31; column++) {

      const theColumn = theRow[column];

      if (facultyDataCountYes[column - 4] == undefined) {
        facultyDataCountYes[column - 4] = 0;
      }

      if (facultyDataCountNo[column - 4] == undefined) {
        facultyDataCountNo[column - 4] = 0;
      }

      if (theColumn == 'YES') {

        facultyDataCountYes[column - 4]++;
      }

      if (theColumn == 'NO') {

        facultyDataCountNo[column - 3]++;
      }
    };
  };



  //generate percentages
  let facultyDataCountNoPercent = [];
  let facultyDataCountYesPercent = [];

  facultyDataCountYes.forEach(count => {

    facultyDataCountYesPercent.push(Math.round((count / TOTAL_DATA_COUNT) * 100));

  });

  facultyDataCountNo.forEach(count => {

    facultyDataCountNoPercent.push(Math.round((count / TOTAL_DATA_COUNT) * 100) + '%');

  });


  console.log(facultyDataCountYesPercent);
  console.log(facultyDataCountNoPercent);

  //const LABELS = "['Photo', 'Name', 'Title', 'Research interests', 'Accepting PhD students', 'Email', 'Telephone', 'Address', 'Google scholar', 'ORCID', 'LinkedIn', 'Twitter', 'About', 'Research groups', 'Research interests', 'Current research', 'Research projects active', 'Research projects completed', 'Publications', 'Supervision current', 'Teaching intro', 'Teaching modules', 'Roles', 'Biography', 'Prizes']";
  const LABELS = "['Photo', 'Name', 'Title', 'Research interests', 'Accepting PhD students', 'Email', 'Telephone', 'Address', 'Google scholar', 'ORCID', 'LinkedIn', 'Twitter', 'About', 'Research groups', 'Research interests', 'Current research', 'Research projects active', 'Research projects completed', 'Publications', 'Supervision current', 'Teaching interests', 'Teaching modules', 'Roles', 'Biography', 'Prizes']";


  const TITLE = "STAFF PROFILE PROGRESS FOR " + faculty.toUpperCase() + ' - ' + TOTAL_DATA_COUNT + ' PROFILES';

  let graphHTML = ` 
      <script>
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
              data: [${facultyDataCountYesPercent}],
              backgroundColor: CHART_COLORS.grey,
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
      </script>`


  graphHTML = ` 
  <script>
    var ctx = document.getElementById('myChart').getContext('2d');

    const CHART_COLORS = {
      red: 'rgb(255, 99, 132)',
      orange: 'rgb(255, 159, 64)',
      yellow: 'rgb(255, 205, 86)',
      green: 'rgb(75, 192, 192)',
      blue: 'rgb(0, 83, 179)',
      purple: 'rgb(153, 102, 255)',
      grey: 'rgb(201, 203, 207)'
    };

    const values = [${facultyDataCountYes}];

    const data = {
      labels: ${LABELS},
      datasets: [
        {
          label: 'Fields completed',
          data: [${facultyDataCountYesPercent}],
          backgroundColor: CHART_COLORS.blue,
        }
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
                text: '% Staff profiles containing data'
              }
            }
        },
        plugins: {
          tooltip: {
            footerFontStyle: 'normal',
            callbacks: {
              label: function(tooltipItem) {
                var label = tooltipItem.dataset.label;
                var value = tooltipItem.parsed.y;
                return label + ' : ' + value + '%';
              },
              footer: function(tooltipItem) {
                var value = values[tooltipItem[0].dataIndex];
                return 'Number of profiles : ' + value;
              }
            }
          },
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
        }
      }
    })
  </script>`

  return graphHTML;
}



function modifyColumns(profile, faculty) {

  var personURL = profile[0];
  var personNameValue = profile[28];
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
  var personTeachingIntro = profile[23];
  var personTeachingModules = profile[24];
  var personRoles = profile[25];
  var personBiography = profile[26];
  var personPrizes = profile[27];
  var personTitleValue = profile[31];
  var personEmailValue = profile[32];
  var personFaculty = profile[33];
  var personSchool = profile[34];
  var personDepartmentSchool = profile[35];

  //determine empty fields
  var fieldsMissingData;
  var heroFields = [];
  var freetextFields = [];
  var showcaseFields = [];
  var numberEmptyFields = 0;

  heroFields.push('These fields help people contact you:');

  if (personPhoto == 'NO') {
    heroFields.push('- Photo');
    numberEmptyFields++;
  }

  if (personTitle == 'NO') {
    heroFields.push('- Title');
    numberEmptyFields++;
  }

  if (personPhDStudents == 'NO') {
    heroFields.push('- Accepting PhD students');
    numberEmptyFields++;
  }

  if (personTelephone == 'NO') {
    heroFields.push('- Telephone number');
    numberEmptyFields++;
  }

  if (personAddress == 'NO') {
    heroFields.push('- Address');
    numberEmptyFields++;
  }

  if (personGoogleScholar == 'NO') {
    heroFields.push('- Google scholar');
    numberEmptyFields++;
  }

  if (personORCID == 'NO') {
    heroFields.push('- ORCID');
    numberEmptyFields++;
  }

  if (personLinkedIn == 'NO') {
    heroFields.push('- LinkedIn');
    numberEmptyFields++;
  }

  if (personTwitter == 'NO') {
    heroFields.push('- Twitter');
    numberEmptyFields++;
  }

  freetextFields.push('These fields help people understand more about you:');

  if (personAbout == 'NO') {
    freetextFields.push('- About');
    numberEmptyFields++;
  }
  if (personResearchInterests == 'NO') {
    freetextFields.push('- Research interests');
    numberEmptyFields++;
  }
  if (personResearchCurrent == 'NO') {
    freetextFields.push('- Current research');
    numberEmptyFields++;
  }
  if (personTeachingIntro == 'NO') {
    freetextFields.push('- Teaching interests');
    numberEmptyFields++;
  }
  if (personBiography == 'NO') {
    freetextFields.push('- Biography');
    numberEmptyFields++;
  }

  showcaseFields.push('These fields help you showcase your achievements:');

  if (personResearchGroups == 'NO') {
    showcaseFields.push('- Research groups');
    numberEmptyFields++;
  }
  if (personResearchProjectsActive == 'NO') {
    showcaseFields.push('- Research projects active');
    numberEmptyFields++;
  }
  if (personResearchProjectsCompleted == 'NO') {
    showcaseFields.push('- Research projects completed');
    numberEmptyFields++;
  }
  if (personPublications == 'NO') {
    showcaseFields.push('- Publications');
    numberEmptyFields++;
  }
  if (personSupervisionCurrent == 'NO') {
    showcaseFields.push('- Supervision current');
    numberEmptyFields++;
  }
  if (personTeachingModules == 'NO') {
    showcaseFields.push('- Teaching modules');
    numberEmptyFields++;
  }
  if (personRoles == 'NO') {
    showcaseFields.push('- Roles and responsibilities');
    numberEmptyFields++;
  }
  if (personPrizes == 'NO') {
    showcaseFields.push('- Prizes');
    numberEmptyFields++;
  }

  var heroFieldsString = heroFields.join('%0D%0A');
  var freetextFieldsString = freetextFields.join('%0D%0A');
  var showcaseFieldsString = showcaseFields.join('%0D%0A');

  var emailBody = [];
  // emailBody.push('Hello ' + personNameValue + ',');
  // emailBody.push('%0D%0A%0D%0AHave you seen your new staff profile? %0D%0A%0D%0A');
  // emailBody.push('%0D%0A%0D%0AThe profile works best when all the data fields are completed.  I list below the data fields on your profile which are empty.%0D%0A%0D%0A');
  // emailBody.push(heroFieldsString);
  // emailBody.push('%0D%0A%0D%0AThank you.');
  // emailBody.push('%0D%0A');

  emailBody += ('Hello ' + personNameValue + ',');
  emailBody += ('%0D%0A%0D%0AHave you seen your new staff profile? ');
  emailBody += ('%0D%0A%0D%0A' + personURL);
  emailBody += ('%0D%0A%0D%0AYour profile works best if you complete all sections.  Each section is made up of a number of data fields. Some fields won\'t apply to you, it\'s okay to leave those empty.');
  emailBody += ('%0D%0A%0D%0AYour profile currently has ' + numberEmptyFields + ' empty fields.');

  if (heroFields.length > 1) {
    emailBody += ('%0D%0A%0D%0A' + heroFieldsString);
  }
  if (freetextFields.length > 1) {
    emailBody += ('%0D%0A%0D%0A' + freetextFieldsString);
  }
  if (showcaseFields.length > 1) {
    emailBody += ('%0D%0A%0D%0A' + showcaseFieldsString);
  }

  emailBody += ('%0D%0A%0D%0AFor help with updating your profile, see the staff profile guidance on Sharepoint.');
  emailBody += ('%0D%0A%0D%0Ahttps://sotonac.sharepoint.com/teams/staff-profile-guidance');
  emailBody += ('%0D%0A%0D%0AThank you.');
  emailBody += ('%0D%0A');

  //var emailBodyString = emailBody.join('%0D%0A');

  //url encode the body
  //emailBodyString.replace(/\s/g, '%20')

  //add html link to staff profile
  var newPersonURL = '<a href="' + personURL + '" target="_blank"> ' + personNameValue + '</a';

  //add a mail to the mail link
  var newPersonEmailValue = '<a href="mailto:' + personEmailValue + '?subject=Please update your new staff profile&body=' + emailBody + '">' + personEmailValue + '</a>';

  var envelopeICON = '<i class="fa fa-envelope" style="font-size:36px;;color:red;"></i>';

  var envelopeICON = '<a href="mailto:' + personEmailValue + '?subject=Please update your new staff profile&body=' + emailBody + '"> <i class="fa fa-envelope" style="font-size:24px;color:#4863A0;"></i></a>';

  //create special array with subset of columns
  profileArray = [];

  if (faculty == 'Faculty not set') {
    profileArray.push(newPersonURL, personTitleValue, envelopeICON, personDataCount.toString(), personPhoto, personName, personTitle, personResearchInterestsHero, personPhDStudents, personEmail, personTelephone, personAddress, personGoogleScholar, personORCID, personLinkedIn, personTwitter, personAbout, personResearchGroups, personResearchInterests, personResearchCurrent, personResearchProjectsActive, personResearchProjectsCompleted, personPublications, personSupervisionCurrent, personTeachingIntro, personTeachingModules, personRoles, personBiography, personPrizes, newPersonEmailValue, personFaculty, personSchool, personDepartmentSchool);
  } else {
    profileArray.push(newPersonURL, personTitleValue, envelopeICON, personDataCount.toString(), personPhoto, personName, personTitle, personResearchInterestsHero, personPhDStudents, personEmail, personTelephone, personAddress, personGoogleScholar, personORCID, personLinkedIn, personTwitter, personAbout, personResearchGroups, personResearchInterests, personResearchCurrent, personResearchProjectsActive, personResearchProjectsCompleted, personPublications, personSupervisionCurrent, personTeachingIntro, personTeachingModules, personRoles, personBiography, personPrizes, newPersonEmailValue);
  }

  return profileArray;
}



function setupHTMLReport(faculty) {

  //setup today's data and time for the report
  var today = new Date();
  today = today.toDateString() + ' ' + today.toLocaleTimeString();

  //
  //create html report
  //
  var htmlReport = '';
  htmlReport += '<html><head>';
  htmlReport += `
      <title>Digital UX Team - Staff Profile Dashboard</title>
      <!--Chart.js JS CDN-->
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <link rel="stylesheet" type="text/css" href="../../../../../css/dux-dashboard.css" />
      <link
      rel="icon"
      href="http://dux.soton.ac.uk/drupal-reports/favicon/favicon.ico"
    />`;

  if (faculty == 'Faculty not set') {

    htmlReport += '</head><body>';
    htmlReport += '<header id="mainheader"> <div class="container"> <h1>Digital UX Team - Staff Profile Dashboard - ' + faculty + '</h1></div></header>';
    htmlReport += '<section class="mainsection">';
    htmlReport += '<div id="reportdate">Updated on ' + today + '</div>';
    htmlReport += '<hr>';
    htmlReport += '<h2>How to use this report</h2>';
    htmlReport += '<div>The new staff profile is driven by data from source systems  <a href="https://subscribe.soton.ac.uk" > Subscribe</a> and <a href="https://pure.soton.ac.uk/admin/login.xhtml"  > Pure</a>.  Members of staff update these source systems and their updates automatically pull through on to their staff profile within 24 hours.</div>';
    //htmlReport += '<br>';
    htmlReport += '<div>A staff profile contains 25 data fields. The dashboard identifies members of staff who have a staff profile and do not align with a faculty and school (in HR and Pure systems).</div>';
    //htmlReport += '<br>';
    htmlReport += '<div>The dashboard contains members of staff whose <a href="https://subscribe.soton.ac.uk" > Subscribe</a> profile has been made public.  If members of staff are missing, guide them to the <a href="https://sotonac.sharepoint.com/teams/staff-profile-guidance#how-to-create-your-new-profile"  > how to create your new profile</a> instructions on the staff profile guidance Sharepoint site.</div>';
    //htmlReport += '<br>';
    htmlReport += '<div>Use the dashboard to identify missing people from your main faculty dashboard and to work with them to update their staff profile. </div>';
    //htmlReport += '<br>';
    htmlReport += '<div>Please note:</div>';
    htmlReport += '<ul>';
    htmlReport += '<li>Some data fields will not apply to all members of staff. For example, Twitter is an optional addition to a staff profile. ';
    htmlReport += '<li>The members of staff listed in this dashboard do not have a faculty and school defined in their HR and Pure data.';
    htmlReport += '<li>Refer staff members to the <a href="https://sotonac.sharepoint.com/teams/staff-profile-guidance/SitePages/add-content-staff-profile-first-time.aspx"   > staff profile guidance</a> Sharepoint site for information on how to update their profile.';
    htmlReport += '<li>User feedback is documented in the <a href="https://sotonac.sharepoint.com/teams/staff-profile-guidance/SitePages/known-problems-with-staff-profiles.aspx"   >known problems with staff profiles</a> section of the Sharepoint site.';
    htmlReport += '<li>The dashboard data is updated every day at around 14:00.';
    htmlReport += '</ul>';
    htmlReport += '<div>Report a bug:</div>';
    htmlReport += '<ul>';
    htmlReport += '<li>Review <a href="https://sotonac.sharepoint.com/teams/staff-profile-guidance/SitePages/known-problems-with-staff-profiles.aspx">known problems with staff profiles</a> before reporting a bug in case it has already been raised.';
    htmlReport += '<li>Please see the <a href="http://dux.soton.ac.uk/faculty-readiness-dashboard/report-a-bug.html"> bug reporting</a> page.';
    htmlReport += '</ul>';



    //htmlReport += '<li>The <a href="https://sotonac.sharepoint.com/teams/staff-profile-guidance"  target="_blank" > staff profile guidance</a> Sharepoint site provides help and assitance needed for staff members to update their staff profile page.';
    //htmlReport += '<li>The dashboard will be updated regularly.';
    htmlReport += '</ul>';
    htmlReport += '<hr>';
    htmlReport += '<h2>Summary of faculty progress</h2>';
    htmlReport += '<div>The chart shows current staff profile readiness.  It shows staff profile field usage across all staff profiles for people with faculty assigned. </div>';
    //htmlReport += '<br>';
    htmlReport += '<div><canvas id="myChart" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas></div>';
    // htmlReport += '<br>';
    htmlReport += '<hr>';

  } else {

    htmlReport += '</head><body>';
    htmlReport += '<header id="mainheader"> <div class="container"> <h1>Digital UX Team - Staff Profile Dashboard - ' + faculty + '</h1></div></header>';
    htmlReport += '<section class="mainsection">';
    htmlReport += '<div id="reportdate">Updated on ' + today + '</div>';
    htmlReport += '<hr>';
    htmlReport += '<h2>How to use this dashboard</h2>';
    htmlReport += '<div>The new staff profile is driven by data from source systems  <a href="https://subscribe.soton.ac.uk"  > Subscribe</a> and <a href="https://pure.soton.ac.uk/admin/login.xhtml"  > Pure</a>.  Members of staff update these source systems and their updates automatically pull through on to their staff profile within 24 hours.  </div>';
    //htmlReport += '<br>';
    htmlReport += '<div>A staff profile contains 25 data fields. The dashboard identifies which data fields contain information for each member of staff in your faculty. The dashboard is broken down by school. </div>';
    //htmlReport += '<br>';
    htmlReport += '<div>The dashboard contains members of staff whose <a href="https://subscribe.soton.ac.uk">  Subscribe</a> profile has been made public.  If members of staff are missing, guide them to the <a href="https://sotonac.sharepoint.com/teams/staff-profile-guidance#how-to-create-your-new-profile"> how to create your new profile</a> instructions on the staff profile guidance Sharepoint site.</div>';
    //htmlReport += '<br>';
    htmlReport += '<div>Use the dashboard to understand your faculty\'s readiness and to work with faculty staff to update their staff profile. </div>';
    //htmlReport += '<br>';
    htmlReport += '<div>Please note:</div>';
    htmlReport += '<ul>';
    htmlReport += '<li>Some data fields will not apply to all members of staff. For example, Twitter is an optional addition to a staff profile. ';
    htmlReport += '<li>The faculty and school assignment is based on data provided by Pure and HR.  It is not possible to change these assignments.';
    htmlReport += '<li>Refer staff members to the <a href="https://sotonac.sharepoint.com/teams/staff-profile-guidance/SitePages/add-content-staff-profile-first-time.aspx"> staff profile guidance</a> Sharepoint site for information on how to update their profile.';
    htmlReport += '<li>User feedback is documented in the <a href="https://sotonac.sharepoint.com/teams/staff-profile-guidance/SitePages/known-problems-with-staff-profiles.aspx">known problems with staff profiles</a> section of the Sharepoint site.';
    htmlReport += '<li>The dashboard data is updated every day at around 14:00.';
    htmlReport += '</ul>';
    htmlReport += '<div>Report a bug:</div>';
    htmlReport += '<ul>';
    htmlReport += '<li>Review <a href="https://sotonac.sharepoint.com/teams/staff-profile-guidance/SitePages/known-problems-with-staff-profiles.aspx" >known problems with staff profiles</a> before reporting a bug in case it has already been raised.';
    htmlReport += '<li>Please see the <a href="http://dux.soton.ac.uk/faculty-readiness-dashboard/report-a-bug.html"> bug reporting</a> page.';
    htmlReport += '</ul>';
    htmlReport += '<div>Send an email</div>';
    htmlReport += '<ul>';
    htmlReport += '<li>Click <i class="fa fa-envelope" style="font-size:17px;;color:#4863A0;"></i> to generate a personalised email. The email will contain a list of empty fields with links to their profile and the staff profile guidance on Sharepoint.';
    htmlReport += '<li>The email is loaded into your default email client and can be amended as needed.';
    htmlReport += '<li>This is an experimental feature and should work for most browsers and environments.';
    htmlReport += '</ul>';
    //htmlReport += '<li>The <a href="https://sotonac.sharepoint.com/teams/staff-profile-guidance"  target="_blank" > staff profile guidance</a> Sharepoint site provides help and assitance needed for staff members to update their staff profile page.';
    //htmlReport += '<li>The dashboard will be updated regularly.';

    htmlReport += '<hr>';
    htmlReport += '<h2>Summary of faculty progress</h2>';
    htmlReport += '<div>The chart shows your faculty\'s current staff profile readiness.  It shows staff profile field usage across all staff profiles in your faculty. </div>';
    //htmlReport += '<br>';
    htmlReport += '<div><canvas id="myChart" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas></div>';
    //htmlReport += '<br>';
    htmlReport += '<hr>';
  }

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

//performStaffProfileDiff(argv.domain);
createStaffProfileFacultyReport();
createOverallProgressReport();

