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


function displayStaffProfileTakeUp(quantity) {

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
  var fieldIndex = [];

  staffDataRaw.forEach(staffRow => {
    var staffRowArray = staffRow.split(',');
    fieldIndexValue = staffRowArray[2].toString();

    //console.log(fieldIndexValue);

    if (fieldIndex[fieldIndexValue] == undefined) {
      fieldIndex[fieldIndexValue] = 1;
    } else {
      fieldIndex[fieldIndexValue]++;
    }
    //console.log(staffRowArray[38]);
  })

  //create totals
  staffDataRaw.shift();
  staffDataRaw.shift();
  var totalNumberLiveProfiles = staffDataRaw.length;
  var totalNumberEligibleProfiles = 5985;
  var totalNumberMissingProfiles = totalNumberEligibleProfiles - totalNumberLiveProfiles;

  //create totals chart
  var totalChartData = [];
  totalChartData.push(totalNumberLiveProfiles);
  totalChartData.push(totalNumberMissingProfiles);

  var totalNumberLiveProfilesPercentage = Math.round((totalNumberLiveProfiles / totalNumberEligibleProfiles) * 100);
  var totalNumberMissingProfilesPercentage = Math.round((totalNumberMissingProfiles / totalNumberEligibleProfiles) * 100);

  var totalChartLabels = [];
  totalChartLabels.push('"Staff profiles live on Drupal - ' + totalNumberLiveProfilesPercentage + '%"');
  totalChartLabels.push('"Staff profiles missing from Drupal - ' + totalNumberMissingProfilesPercentage + '%"');

  totalStaffProfilesTitle = 'STAFF PROFILES ENGAGEMENT - ELIGIBLE STAFF - ' + totalNumberEligibleProfiles;

  console.log('Number profiles = ' + totalNumberLiveProfiles);

  //create percentages
  //get the keys of the array (field index numbers)
  myKeys = fieldIndex.keys();

  //create an array to capture the percentages
  var fieldUsagePercentage = [];

  var fieldLabels = [];
  var fieldLabelsInt = [];

  var count = 0;
  for (let index = 2; index < fieldIndex.length; index++) {

    var value = fieldIndex[index];

    var percentage = Math.round((value / totalNumberLiveProfiles) * 100);
    var percentage = (value / totalNumberLiveProfiles) * 100;

    console.log('index ' + index + ' value = ' + value + ' per = ' + percentage);

    fieldLabels.push("'" + index + "'");
    fieldLabelsInt.push(index);
    if (Number.isNaN(value)) {
      fieldUsagePercentage.push(0);
    } else {
      fieldUsagePercentage.push(percentage);
    }


    count = count + value;

  }

  for (let index = 0; index < 24; index++) {
    if (Number.isNaN(fieldUsagePercentage[index])) {
      fieldUsagePercentage[index] = 0;
    }
  }

  console.log('count = ' + count);

  var chartLabels = [];
  var chartData = [];




  //1-8
  var level1Percentage = fieldUsagePercentage[0] + fieldUsagePercentage[1] + fieldUsagePercentage[2] + fieldUsagePercentage[4] + fieldUsagePercentage[4] + fieldUsagePercentage[5] + fieldUsagePercentage[6] + fieldUsagePercentage[7];

  var level2Percentage = fieldUsagePercentage[8] + fieldUsagePercentage[9] + fieldUsagePercentage[10] + fieldUsagePercentage[11] + fieldUsagePercentage[12] + fieldUsagePercentage[13] + fieldUsagePercentage[14] + fieldUsagePercentage[15];

  var level3Percentage = fieldUsagePercentage[16] + fieldUsagePercentage[17] + fieldUsagePercentage[18] + fieldUsagePercentage[19] + fieldUsagePercentage[20] + fieldUsagePercentage[21] + fieldUsagePercentage[22];

  var level1 = fieldIndex[0] + fieldIndex[1] + fieldIndex[2] + fieldIndex[4] + fieldIndex[4] + fieldIndex[5] + fieldIndex[6] + fieldIndex[7];

  var level2 = fieldIndex[8] + fieldIndex[9] + fieldIndex[10] + fieldIndex[11] + fieldIndex[12] + fieldIndex[13] + fieldIndex[14] + fieldIndex[15];

  var level3 = fieldIndex[16] + fieldIndex[17] + fieldIndex[18] + fieldIndex[19] + fieldIndex[20] + fieldIndex[21] + fieldIndex[22] + fieldIndex[23];

  chartData.push(Math.round(level1Percentage));
  chartData.push(Math.round(level2Percentage));
  chartData.push(Math.round(level3Percentage));

  chartLabels.push('"1-8 fields completed - ' + chartData[0] + '%"');
  chartLabels.push('"9-16 fields completed - ' + chartData[1] + '%"');
  chartLabels.push('"17-24 fields completed - ' + chartData[2] + '%"');

  console.log('------->' + chartData);

  //setup today's data and time for the report
  var today = new Date();
  today = today.toDateString() + ' ' + today.toLocaleTimeString();
  var timestamp = globalSettings.getTimestamp('today', 'yymmdd');

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

  htmlReport += '<header id="mainheader"> <div class="container"> <h1>Digital UX Team - Staff Profile Engagement</h1></div></header>';
  htmlReport += '<section class="mainsection">';
  htmlReport += '<div id="reportdate">Updated on ' + today + '</div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>Staff profile eligibility criteria</h2>';
  htmlReport += '<div>The following job categories are eligible for a staff profile: </div > ';
  htmlReport += '<ul>';
  htmlReport += '<li>Education, Research and Enterprise (ERE) Level 4 and above, including Balanced, Education, Research, and Enterprise pathways  ';
  htmlReport += '<li>Research Nurse (RESN) Level 4 and above  ';
  htmlReport += '<li>Technical and Experimental (TAE) Level 5 only  ';
  htmlReport += '<li>Clinical Academic (CLIN) Clinical Academic Roles, and Clinical Consultant Roles ';
  htmlReport += '</ul>';
  htmlReport += '<div>Staff members must <a href="https://sotonac.sharepoint.com/teams/staff-profile-guidance/SitePages/add-content-staff-profile-first-time.aspx#what-to-update-in-subscribe">manually update Subscribe</a> to make their profile public. </div > ';
  htmlReport += '<div>The charts below provide an overview of the current engagement of staff profile for eligible staff.</div > ';
  htmlReport += '<section id="callout"><div>The team is investigating available data to provide greater detail by faculty.</div></section> ';
  htmlReport += '<hr>';
  htmlReport += '<h2>Staff profile engagement for eligible staff</h2>';
  htmlReport += '<div>There are ' + totalNumberEligibleProfiles + ' staff who are eligible for a staff profile. </div > ';
  htmlReport += '<ul>';
  htmlReport += '<li>' + totalNumberLiveProfiles + ' (' + totalNumberLiveProfilesPercentage + '%) staff have a profile on Drupal';
  htmlReport += '<li>' + totalNumberMissingProfiles + ' (' + totalNumberMissingProfilesPercentage + '%) staff <strong>do not</strong> have a profile on Drupal because their Subscribe profile is not set to public.';
  htmlReport += '</ul>';
  htmlReport += '<br>';
  htmlReport += '<div><canvas id="StaffProfileEngagementAllStaff" style="height:50%;max-height:300" style="width:75%;max-width:300px"></canvas></div>';
  //htmlReport += '<br>';
  htmlReport += '<hr>';
  htmlReport += '<h2>Staff profile engagement for live profiles on Drupal</h2>';
  htmlReport += '<div>There are ' + totalNumberLiveProfiles + ' staff who have a profile live on Drupal </div > ';
  htmlReport += '<div>The chart shows the breakdown of engagement in terms of the number of data fields completed.  </div > ';
  htmlReport += '<br>';
  htmlReport += '<div><canvas id="StaffProfileEngagementDrupalLive" style="height:50%;max-height:300" style="width:75%;max-width:300px"></canvas></div>';
  //htmlReport += '<br>';
  htmlReport += '<hr>';


  let staffProfilesLiveTitle = 'STAFF PROFILES ENGAGEMENT - LIVE PROFILES - ' + totalNumberLiveProfiles;

  htmlReport += `<script>
        var ctx = document.getElementById('StaffProfileEngagementAllStaff').getContext('2d');
    
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
          labels: [${totalChartLabels}],
          datasets: [
            {
              label: 'STAFF PROFILE ENGAGEMENT',
              data: [${totalChartData}],
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
                text: '${totalStaffProfilesTitle}',
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
                  text: 'Staff profile engagement in terms of number of data fields completed',
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
      var ctx = document.getElementById('StaffProfileEngagementDrupalLive').getContext('2d');
  
       data = {
        labels: [${chartLabels}],
        datasets: [
          {
            label: 'STAFF PROFILE ENGAGEMENT',
            data: [${chartData}],
            backgroundColor: [CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.orange, CHART_COLORS.yellow, CHART_COLORS.grey, CHART_COLORS.purple,]
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
              text: '${staffProfilesLiveTitle}',
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
                text: 'Staff profile engagement in terms of number of data fields completed',
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

  fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/faculty-progress/html/staff-profile-engagement-' + timestamp + '.html', htmlReport);
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'staff-profile/faculty-progress/html/staff-profile-engagement.html', htmlReport);

}
var staffProfileTakeupData = displayStaffProfileTakeUp(20);
//createHTMLReportChart(staffProfileTakeupData);
