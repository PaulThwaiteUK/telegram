const fs = require('fs');
const htmlFunctions = require('../local-modules/html-functions');
const yargs = require("yargs");
const globalSettings = require('../local-modules/report-settings');

const REPORTS_DATA_FOLDER = globalSettings.getReportsFolder();
const URL_LISTS_FOLDER = globalSettings.getUrlListsFolder();

//DATA CONST
var DATE_TODAY = globalSettings.getTimestamp('today', 'yymmdd');

PROJECTS_DATA_FOLDER = REPORTS_DATA_FOLDER + 'research-projects/field-progress/csv/research-projects-data-field-progress-' + DATE_TODAY + '.csv';
STAFF_PROFILE_DATA_LATEST = REPORTS_DATA_FOLDER + 'staff-profile/field-progress/csv/staff-profile-field-index-' + DATE_TODAY + '.csv';


function getResearchProjectData() {

  var projectDataRaw;
  var staffDataRaw;
  var projectData = [];

  //read in data
  try {
    projectDataRaw = fs.readFileSync(PROJECTS_DATA_FOLDER).toString().split("\n");
    staffDataRaw = fs.readFileSync(STAFF_PROFILE_DATA_LATEST).toString().split("\n");
  } catch (error) {
    console.log('Error loading file' + error);
    process.exit();
  }

  console.log('');
  console.log('Project data for today is in ' + PROJECTS_DATA_FOLDER);
  console.log('Staff data for today is in ' + STAFF_PROFILE_DATA_LATEST);


  projectDataRaw.forEach(projectRowArray => {
    var projectRowArray = projectRowArray.split(',');

    let projectURL = projectRowArray[0];
    let projectTitleValue = projectRowArray[1];
    let projectStatusValue = projectRowArray[2];
    let projectFunderValue = projectRowArray[3];
    let projectLeadResearcherURL = projectRowArray[4];
    let projectLeadResearcherName = projectRowArray[5];
    let projectLeadResearcerFaculty = projectRowArray[6];
    let projectLeadResearcerSchool = projectRowArray[7];
    let projectDataLoadTime = projectRowArray[8];
    let projectDataCount = projectRowArray[9];
    let projectTitle = projectRowArray[10];
    let projectResearchArea = projectRowArray[11];
    let projectResearchGroup = projectRowArray[12];
    let projectLeadResearcher = projectRowArray[13];
    let projectOtherResearchers = projectRowArray[14];
    let projectResearchFunder = projectRowArray[15];
    let projectWebsite = projectRowArray[16];
    let projectStatus = projectRowArray[17];
    let projectOverview = projectRowArray[18];
    let projectStaffLeadResearcher = projectRowArray[19];
    let projectStaffOtherResearchers = projectRowArray[20];
    let projectResearchOutputs = projectRowArray[21];
    let projectPartners = projectRowArray[22];

    projectData.push([projectURL, projectStatusValue, projectFunderValue, projectLeadResearcherURL, projectDataCount.toString(), projectTitle, projectResearchArea, projectResearchGroup, projectLeadResearcher, projectOtherResearchers, projectResearchFunder, projectWebsite, projectStatus, projectOverview, projectStaffLeadResearcher, projectStaffOtherResearchers, projectResearchOutputs, projectPartners, projectLeadResearcerFaculty.toString(), projectLeadResearcerSchool.toString()]);
  })

  return projectData;
}


function generateStatusReport(projectData) {

  //setup today's data and time for the report
  var today = new Date();
  today = today.toDateString() + ' ' + today.toLocaleTimeString();

  let closedProjects = [];
  let activeProjects = [];

  projectData.forEach(projectArray => {

    //console.log(projectArray);

    //console.log(projectArray[18]);

    let projectStatusValue = projectArray[1];
    let projectURL = projectArray[0];
    let projectFunderValue = projectArray[2];
    let projectLeadResearcherURL = projectArray[3];
    let projectLeadResearcerFaculty = projectArray[18];
    let projectLeadResearcerSchool = projectArray[19];

    if (projectStatusValue == 'Active') {
      activeProjects.push([projectURL, projectFunderValue, projectLeadResearcherURL, projectLeadResearcerFaculty, projectLeadResearcerSchool]);
    }

    if (projectStatusValue == 'Not active') {
      closedProjects.push([projectURL, projectFunderValue, projectLeadResearcherURL, projectLeadResearcerFaculty, projectLeadResearcerSchool]);
    }
  })

  let numberActiveProjects = activeProjects.length;
  let numberClosedProjects = closedProjects.length;
  let statusesCount = [];
  let statusesLabels = [];
  statusesCount.push(numberActiveProjects, numberClosedProjects);
  statusesLabels.push('Active', 'Not active');

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
                width: 20%;
            }
  
        </style>
        
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Research project status analysis</title>
      <!--Chart.js JS CDN-->
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`;


  htmlReport += '</head><body>';
  htmlReport += '<header id="mainheader"> <div class="container"> <h1>Digital UX Team - Research Project Status</h1></div></header>';
  htmlReport += '<section class="mainsection">';
  htmlReport += '<div id="reportdate">Updated on ' + today + '</div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>Funder summary</h2>';
  htmlReport += '<div>A summary of research projects by status. </div>';
  htmlReport += '<br>';
  htmlReport += '<div><canvas id="myChart" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas></div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>List of active reseaech projects.</h2>';
  htmlReport += '<div>A list of research projects which are currently active.  </div>';
  htmlReport += '<br>';
  htmlReport += htmlFunctions.generateTable(activeProjects);
  htmlReport += '<br>';
  htmlReport += '<hr>';
  htmlReport += '<h2>List of closed reseaech projects.</h2>';
  htmlReport += '<div>A list of research projects which are closed.  </div>';
  htmlReport += '<br>';
  htmlReport += htmlFunctions.generateTable(closedProjects);
  htmlReport += '<br>';
  htmlReport += '<hr>';

  const TITLE = "RESEARCH PROJECTS BY STATUS";

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
            labels: [${statusesLabels}],
            datasets: [
              {
                label: 'NUMBER OF RESEARCH PROJECTS BY STATUS',
                data: [${statusesCount}],
                backgroundColor: [CHART_COLORS.blue, CHART_COLORS.orange]
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
                  text: 'RESEARCH PROJECTS BY FACULTY',
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
                    text: 'Current breakdown of research projects by project status',
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
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'research-projects/faculty-progress/html/research-projects-status-analysis.html', htmlReport);



}


function generateReportByFaculty(projectData) {

  var ART_FACULTY = 'Faculty of Arts and Humanities';
  var ENG_FACULTY = 'Faculty of Engineering and Physical Sciences';
  var ENV_FACULTY = 'Faculty of Environmental and Life Sciences';
  var MED_FACULTY = 'Faculty of Medicine';
  var SOC_FACULTY = 'Faculty of Social Sciences';
  var PS_FACULTY = 'Professional Services';
  var NO_FACULTY = '';
  var FACULTY_NOT_DEFINED = 'Faculty not set';
  var SCHOOL_NOT_DEFINED = 'School not set';

  console.log('Total data size = ' + projectData.length);

  //sort data by data index
  projectData.sort(function (a, b) {
    return b[4] - a[4];
  })

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

  var facultyReportData = [];

  //assign faculties with schools with departments
  projectData.forEach(profileArray => {

    var faculty = profileArray[18];
    var school = profileArray[19];
    var department = profileArray[19];
    var leadResearcherURL = profileArray[4];

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

      facultyReportData[FACULTY_NOT_DEFINED][SCHOOL_NOT_DEFINED].push([profileArray]);


    } else {

      if (facultyReportData[faculty] == undefined) {
        facultyReportData[faculty] = [];
      }

      if (facultyReportData[faculty][school] == undefined) {
        facultyReportData[faculty][school] = [];
      }

      //remove faculty and school from the data - not needed for the faculty table
      profileArray.pop();
      profileArray.pop();

      //facultyReportData[faculty][school][department].push([profile]);
      facultyReportData[faculty][school].push([profileArray]);

    }
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

  //sort schools
  artsSchool.sort();
  engSchool.sort();
  envSchool.sort();
  medSchool.sort();
  psSchool.sort();
  socSchool.sort();


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


  //create labels for pie chart
  ART_FACULTY = "'Arts and Humanities (" + artsCount + ")'";
  ENG_FACULTY = "'Engineering and Physical Sciences (" + engCount + ")'";
  ENV_FACULTY = "'Environmental and Life Sciences (" + envCount + ")'";
  MED_FACULTY = "'Medicine (" + medCount + ")'";
  SOC_FACULTY = "'Social Sciences (" + socCount + ")'";
  PS_FACULTY = "'Professional Services (" + psCount + ")'";
  NO_FACULTY = "'Faculty not set (" + undefinedCount + ")'";

  var facultiesLabels = [];
  facultiesLabels.push(ART_FACULTY);
  facultiesLabels.push(ENG_FACULTY);
  facultiesLabels.push(ENV_FACULTY);
  facultiesLabels.push(MED_FACULTY);
  facultiesLabels.push(SOC_FACULTY);
  facultiesLabels.push(PS_FACULTY);
  facultiesLabels.push(NO_FACULTY);

  //create index page
  var facultyCount = [];
  facultyCount.push(artsCount, engCount, envCount, medCount, socCount, psCount, undefinedCount);
  facultyCountTotal = artsCount + engCount + envCount + medCount + socCount + psCount + undefinedCount;
  createResearchProjectProgressIndexPage(facultiesLabels, facultyCount, facultyCountTotal);
  console.log('Faculty count = ' + facultyCount);
}



function createResearchProjectProgressIndexPage(facultiesLabels, facultyCount, facultyCountTotal) {

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
      <title>Digital UX Team - Research Project Dashboard</title>
      <!--Chart.js JS CDN-->
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <link rel="stylesheet" type="text/css" href="../../../../../css/dux-dashboard.css" /><link
      rel="icon"
      href="http://dux.soton.ac.uk/drupal-reports/favicon/favicon.ico"
    />`;


  htmlReport += '</head><body>';
  htmlReport += '<header id="mainheader"> <div class="container"> <h1>Digital UX Team - Research Project Dashboard</h1></div></header>';
  htmlReport += '<section class="mainsection">';
  htmlReport += '<div id="reportdate">Updated on ' + today + '</div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>Number of research projects by faculty </h2>';
  //htmlReport += '<div> </div>';
  htmlReport += '<div><canvas id="myChart" style="height:50%;max-height:300" style="width:75%;max-width:300px"></canvas></div>';
  //htmlReport += '<br>';
  htmlReport += '<hr>';
  htmlReport += '<h2>Faculty progress</h2>';
  htmlReport += '<div>Select your faculty below to see the current progress.  </div>';
  //htmlReport += '<br>';
  htmlReport += '<div>Research projects are grouped by faculty and school. The faculty and school data is based on data from Pure and HR. Some research projects do not have a faculty and school assigned. These research projects can be found in the \'Faculty not set\' dashboard. </div>';
  //htmlReport += '<br>';
  htmlReport += '<div>Some data fields will not apply to every research project.  See further information in the faculty report.  Use this report as a general guide to research project readiness only.  </div>';
  htmlReport += '<ul>';
  htmlReport += '<li><a href="research-projects-faculty-progress-faculty-of-arts-and-humanities.html" > Faculty of Arts and Humanities</a>';
  htmlReport += '<li><a href="research-projects-faculty-progress-faculty-of-engineering-and-physical-sciences.html" > Faculty of Engineering and Physical Sciences</a>';
  htmlReport += '<li><a href="research-projects-faculty-progress-faculty-of-environmental-and-life-sciences.html" > Faculty of Environmental and Life Sciences</a>';
  htmlReport += '<li><a href="research-projects-faculty-progress-faculty-of-medicine.html" > Faculty of Medicine</a>';
  htmlReport += '<li><a href="research-projects-faculty-progress-faculty-of-social-sciences.html" > Faculty of Social Sciences</a>';
  htmlReport += '<li><a href="research-projects-faculty-progress-professional-services.html" > Professional Services</a>';
  htmlReport += '<li><a href="research-projects-faculty-progress-faculty-not-set.html" > Faculty not set</a>';
  htmlReport += '</ul>';
  htmlReport += '<hr>';

  var chartTitle = 'RESEARCH PROJECTS BY FACULTY - ' + facultyCountTotal;


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
            labels: [${facultiesLabels}],
            datasets: [
              {
                label: 'NUMBER OF RESEARCH PROJECTS BY FACULTY',
                data: [${facultyCount}],
                backgroundColor: [CHART_COLORS.blue, CHART_COLORS.red, CHART_COLORS.green, CHART_COLORS.orange, CHART_COLORS.yellow, CHART_COLORS.grey, CHART_COLORS.purple]
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
                    text: 'Current breakdown of research projects across the university\\'s faculties',
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
            labels: [${facultiesLabels}],
            datasets: [
              {
                label: 'NUMBER OF RESEARCH PROJECTS BY FACULTY',
                data: [${facultyCount}],
                backgroundColor: [CHART_COLORS.blue, CHART_COLORS.red, CHART_COLORS.green, CHART_COLORS.orange, CHART_COLORS.yellow, CHART_COLORS.purple]
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
                  text: 'RESEARCH PROJECTS BY FACULTY',
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
                    text: 'Current breakdown of research projects across the university\\'s faculties',
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
  htmlReport += '</body></html>';
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'research-projects/faculty-progress/html/research-projects-faculty-progress.html', htmlReport);

  return htmlReport;
}




function generateHTMLReport(facultyReportData, faculty, schools, departments, profileCount) {

  //setup html report with standard content
  var htmlReport = setupHTMLReport(faculty);

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

  //add detailed section to the the html report
  htmlReport += '<div id="jumptotop"</div>';
  htmlReport += '<h2>Detailed readiness by research project</h2>';
  htmlReport += '<div>The ' + faculty + ' has ' + profileCount + ' research projects. </div>';
  //htmlReport += '<br>';
  htmlReport += '<div>The tables below illustrate the current state of individual research project pages. </div>';
  //htmlReport += '<br>';
  htmlReport += '<div>The report identifies which fields contain data for each member research project in your faculty. The report is broken down by school. </div>';
  //htmlReport += '<br>';
  htmlReport += '<ul><li>YES = data exists on the research project page. ';
  htmlReport += '<li>NO = data does not exist on the research project page.  The project lead researcher needs to update their project in \'Pure\' using the instructions above. </ul>';
  //htmlReport += '<br>';
  //htmlReport += '<br>';
  htmlReport += '<div id="jumptotop"</div>';
  htmlReport += '<section class="research-project-faculty-section">';
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
  var schoolsCount = [];

  schools.forEach(school => {
    schoolsCount[school] = facultyReportData[faculty][school].length;
  })

  console.log('School count = ' + schoolsCount);

  schools.forEach(school => {

    var schoolText = school.replace(/\s/g, "-");
    htmlReport += '<h3 id="' + schoolText + '"> ' + school + ' (' + schoolsCount[school] + ') </h3>';
    htmlReport += '<div id="jumptotop"><a href="#jumptotop">Jump to top</a></div>';
    htmlReport += '<br>';

    if (facultyReportData[faculty][school] != undefined) {

      var data = facultyReportData[faculty][school];
      var profileData = [];

      profileData.push(['Project title', 'Status', 'Funder', 'Lead researcher name', 'Data index (13)', 'Title', 'Research area', 'Research groups', 'Lead researcher', 'Other researches', 'Research funder', 'Research website', 'Research status', 'Research overview', 'Research lead researcher', 'Research other researchers', 'Research outputs', 'Research partners']);

      data.forEach(element => {

        //create array
        var theProfile = element.toString().split(',');

        //add profile to array for html tables
        profileData.push(theProfile);

        //add profile to array for graph
        facultyProfiles.push([theProfile]);

        //tally number of profiles
        count++;
      })

      //add a table array to the html report
      htmlReport += htmlFunctions.generateTable(profileData, 'research-project-faculty-table');
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
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'research-projects/faculty-progress/html/research-projects-faculty-progress-' + facultyText.toLowerCase() + '.html', htmlReport);
}

function createFacultyBarChart(researchProjectDataWithFaculties, faculty) {

  var facultyDataCountYes = [];
  var facultyDataCountNo = [];

  //loop through the profile data and count the number of fields with a YES and a NO
  for (let row = 0; row < researchProjectDataWithFaculties.length; row++) {
    const theRow = researchProjectDataWithFaculties[row][0];

    for (let column = 5; column < 18; column++) {

      const theColumn = theRow[column];

      if (facultyDataCountYes[column - 5] == undefined) {
        facultyDataCountYes[column - 5] = 0;
      }

      if (facultyDataCountNo[column - 5] == undefined) {
        facultyDataCountNo[column - 5] = 0;
      }

      if (theColumn == 'YES') {

        facultyDataCountYes[column - 5]++;
      }

      if (theColumn == 'NO') {

        facultyDataCountNo[column - 5]++;
      }
    };
  };

  //const LABELS = "['Photo', 'Name', 'Title', 'Research interests', 'Accepting PhD students', 'Email', 'Telephone', 'Address', 'Google scholar', 'ORCID', 'LinkedIn', 'Twitter', 'About', 'Research groups', 'Research interests', 'Current research', 'Research projects active', 'Research projects completed', 'Publications', 'Supervision current', 'Teaching intro', 'Teaching modules', 'Roles', 'Biography', 'Prizes']";
  let LABELS = "['Title', 'Research area (CMS)', 'Research groups (CMS)', 'Lead researcher', 'Other researches', 'Research funder', 'Research website', 'Research status', 'Research overview', 'Research lead researcher', 'Research other researchers', 'Research outputs', 'Research partners (CMS)']";

  const TOTAL = researchProjectDataWithFaculties.length;
  const TITLE = "RESEARCH PROJECTS PROGRESS FOR " + faculty.toUpperCase() + ' - ' + TOTAL + ' RESEARCH PROJECTS';

  let graphHTML = ` 
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
          
          const values = [${facultyDataCountYes}];
      
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
                      text: 'Data fields on research project'
                    },
                  },
                y: {
                  stacked: true,
                    title: {
                      display: true,
                      text: '% Research projects containing data'
                    }
                  }
              },
              plugins: {
                tooltip: {
                  footerFontStyle: 'normal'
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
                    text: 'Data fields completed across faculty',
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


function setupHTMLReport(faculty) {

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
                  width: 20%;
              }
    
          </style>
          
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Research project data field analysis</title>
        <!--Chart.js JS CDN-->
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link rel="stylesheet" type="text/css" href="../../../../../css/dux-dashboard.css" />
        <link
        rel="icon"
        href="http://dux.soton.ac.uk/drupal-reports/favicon/favicon.ico"
      />`;


  htmlReport += '</head><body>';
  htmlReport += '<header id="mainheader"> <div class="container"> <h1>Digital UX Team - Research Project Dashboard - ' + faculty + '</h1></div></header>';
  htmlReport += '<section class="mainsection">';
  htmlReport += '<div id="reportdate">Updated on ' + today + '</div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>How to use this report</h2>';
  htmlReport += '<div>The new research projects are primarily driven by data from \'Pure\'.  Project owners update \'Pure\' and the data automatically displays on their research project page.  </div>';
  //htmlReport += '<br>';
  htmlReport += '<div>A research project page is made up of 13 data fields.  </div>';
  htmlReport += '<ul>';
  htmlReport += '<li>Most fields are driven by data from \'Pure\'.  See how to <a href="https://sotonac.sharepoint.com/teams/research-project-guidance/SitePages/edit-a-research-project.aspx" > edit a research project</a> on the research project guidance Sharepoint site.';
  htmlReport += '<li>The \'Research area\' and \'Research groups\' fields are updated by the Digital User Experience team which will be completed before product launch.';
  htmlReport += '<li>Images, video and partner logos are provided to the Digital User Experience team by project owners. See the <a href="https://sotonac.sharepoint.com/teams/research-project-guidance/SitePages/edit-a-research-project.aspx" >images, video and partner logos</a> section of the <a href="https://sotonac.sharepoint.com/teams/research-project-guidance" >research project guideance</a> Sharepoint site.';
  htmlReport += '</ul>';
  htmlReport += 'The <a href="https://sotonac.sharepoint.com/teams/research-project-guidance" > resease project guidance</a> Sharepoint site provides guidance on how to update a research project.';
  htmlReport += '<hr>';
  htmlReport += '<h2>Summary of progress</h2>';
  htmlReport += '<div>The chart below illustrates your faculty\'s current research project readiness.  It shows the number of data fields containing data across all research projects assigned to your faculty (based on a project\'s lead researcher).   </div>';
  //htmlReport += '<br>';
  htmlReport += '<div>Not all data fields will apply to every research project.  Use this chart as a general guide to readiness only.  </div>';
  //htmlReport += '<br>';
  htmlReport += '<div><canvas id="myChart" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas></div>';
  //htmlReport += '<br>';
  //htmlReport += '<hr>';

  return htmlReport;
}

function generateFunderReport(projectData) {

  //
  //funder
  //

  //store all funders and then remove dups and sort 
  var funderList = [];

  projectData.forEach(project => {
    var funderName = project[2];

    if (funderName == '') {
      funderName = 'Undefined';
    }

    funderList.push(funderName);
  })

  //remove duplicates
  funderList = [...new Set(funderList)];

  //sort schools
  funderList.sort();

  //count funders by project
  var funderTotals = []
  projectData.forEach(profileArray => {

    var funderName = profileArray[2];

    if (funderName == '') {
      funderName = 'Undefined';
      profileArray[2] = 'Undefined';
    }

    if (funderTotals[funderName] == undefined) {
      funderTotals[funderName] = 0;
    }

    funderTotals[funderName]++;

  })

  //build a table for each project by funder
  projectData.sort(function (a, b) {
    return b[2] - a[2];
  });



  projectFunderTable = [];
  funderList.forEach(funder => {
    var count = 0;
    projectData.forEach(project => {

      var projectFunderValue = project[2];
      var projectTitle = project[0];
      var projectLeadResearcherURL = project[3];

      if (funder == projectFunderValue) {

        // console.log(funder);

        if (count == 0) {
          projectFunderTable.push([projectFunderValue + ' (' + funderTotals[funder] + ')', projectLeadResearcherURL, projectTitle]);
          count = 1;
        } else {
          projectFunderTable.push(['', projectLeadResearcherURL, projectTitle]);
        }
      }
    })
  });

  //add header to 
  projectFunderTable.unshift(['Funder', 'Project lead researcher', 'Project title']);


  //build the labels and data for the graph
  var graphLabels = [];
  var graphData = [];
  funderList.forEach(funder => {
    //console.log(funder + ' --> ' + funderTotals[funder])

    graphLabels.push('"' + funder + ' (' + funderTotals[funder] + ')"');
    graphData.push(funderTotals[funder]);
  });




  //create the html file
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
                width: 20%;
            }
  
        </style>
        
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Research project data field analysis</title>
      <!--Chart.js JS CDN-->
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <link rel="stylesheet" type="text/css" href="../../../../../css/dux-dashboard.css" />
        <link
        rel="icon"
        href="http://dux.soton.ac.uk/drupal-reports/favicon/favicon.ico"
      />`;


  htmlReport += '</head><body>';
  htmlReport += '<header id="mainheader"> <div class="container"> <h1>Digital UX Team - Research Project Funders</h1></div></header>';
  htmlReport += '<section class="mainsection">';
  htmlReport += '<div id="reportdate">Updated on ' + today + '</div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>UKRI funder summary</h2>';
  htmlReport += '<div>A summary of all UKRI funders associated with research projects.  There are ' + funderList.length + ' funders.</div>';
  htmlReport += '<br>';
  htmlReport += '<div><canvas id="myChart" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas></div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>List of projects for each funder</h2>';
  htmlReport += '<div>A list of UKRI research projects associated with a funder.  </div>';
  htmlReport += '<br>';
  htmlReport += htmlFunctions.generateTable(projectFunderTable);
  htmlReport += '<br>';
  htmlReport += '<hr>';

  const TITLE = "RESEARCH PROJECTS BY FUNDER";

  htmlReport += ` 
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
      
          const data = {
            labels: [${graphLabels}],
            datasets: [
              {
                label: 'RESEARCH PROJECTS',
                data: [${graphData}],
                backgroundColor: CHART_COLORS.blue,
              }
            ]
          };
          
          const values = [${graphData}];
      
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
                      text: 'Research project funder'
                    },
                  },
                y: {
                  stacked: true,
                    title: {
                      display: true,
                      text: 'Number of research projects'
                    }
                  }
              },
              plugins: {
                tooltip: {
                  footerFontStyle: 'normal',
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
                    text: 'A summary of funders across all research projects',
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
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'research-projects/faculty-progress/html/research-projects-funder-analysis.html', htmlReport);
}



//read in projects data
//read in staff person data
//create array of projects, faculty and school
var researchProjectData = getResearchProjectData();

//create project faculty report for projects
//create index page
generateReportByFaculty(researchProjectData);

//create a funder page 
generateFunderReport(researchProjectData);

//creae project by status
//generateStatusReport(researchProjectData);

//create project by confidentiality








