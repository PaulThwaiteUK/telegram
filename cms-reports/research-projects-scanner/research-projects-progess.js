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


  projectDataRaw.forEach(projectRow => {
    var projectRowArray = projectRow.split(',');

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

    projectData.push([projectURL, projectStatusValue, projectFunderValue, projectLeadResearcherURL, projectDataCount, projectTitle, projectResearchArea, projectResearchGroup, projectLeadResearcher, projectOtherResearchers, projectResearchFunder, projectWebsite, projectStatus, projectOverview, projectStaffLeadResearcher, projectStaffOtherResearchers, projectResearchOutputs, projectPartners, projectLeadResearcerFaculty, projectLeadResearcerSchool]);
  })

  return projectData;
}


function generateReportByFaculty(projectData) {

  const ART_FACULTY = 'Faculty of Arts and Humanities';
  const ENG_FACULTY = 'Faculty of Engineering and Physical Sciences';
  const ENV_FACULTY = 'Faculty of Environmental and Life Sciences';
  const MED_FACULTY = 'Faculty of Medicine';
  const SOC_FACULTY = 'Faculty of Social Sciences';
  const NO_FACULTY = '';
  const FACULTY_NOT_DEFINED = 'Faculty not set';
  const SCHOOL_NOT_DEFINED = 'School not set';

  console.log('Total data size = ' + projectData.length);

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

    if (faculty == NO_FACULTY) {

      undefinedSchool.push(SCHOOL_NOT_DEFINED);
      undefinedDepartment.push('No department defined');
      undefinedCount++;
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
  undefinedSchool = [...new Set(undefinedSchool)];
  undefinedDepartment = [...new Set(undefinedDepartment)];

  //sort schools
  artsSchool.sort();
  engSchool.sort();
  envSchool.sort();
  medSchool.sort();
  socSchool.sort();

  //sort data by data index
  facultyReportData.sort(function (a, b) {
    return b[4] - a[4];
  })

  //create html reports for each faculty
  generateHTMLReport(facultyReportData, ART_FACULTY, artsSchool, artsDepartment, artsCount);
  generateHTMLReport(facultyReportData, ENG_FACULTY, engSchool, engDepartment, engCount);
  generateHTMLReport(facultyReportData, ENV_FACULTY, envSchool, envDepartment, envCount);
  generateHTMLReport(facultyReportData, MED_FACULTY, medSchool, medDepartment, medCount);
  generateHTMLReport(facultyReportData, SOC_FACULTY, socSchool, socDepartment, socCount);
  generateHTMLReport(facultyReportData, FACULTY_NOT_DEFINED, undefinedSchool, undefinedDepartment, undefinedCount);

  //create index page
  var facultyCount = [];
  facultyCount.push(artsCount, engCount, envCount, medCount, socCount, undefinedCount);
  createResearchProjectProgressIndexPage(facultyCount);
  console.log('Faculty count = ' + facultyCount);
}



function createResearchProjectProgressIndexPage(facultyCount) {

  const ART_FACULTY = "'Arts and Humanities'";
  const ENG_FACULTY = "'Engineering and Physical Sciences'";
  const ENV_FACULTY = "'Environmental and Life Sciences'";
  const MED_FACULTY = "'Medicine'";
  const SOC_FACULTY = "'Social Sciences'";
  const NO_FACULTY = "'Faculty not set'";

  var FACULTIES = [];
  FACULTIES.push(ART_FACULTY);
  FACULTIES.push(ENG_FACULTY);
  FACULTIES.push(ENV_FACULTY);
  FACULTIES.push(MED_FACULTY);
  FACULTIES.push(SOC_FACULTY);
  FACULTIES.push(NO_FACULTY);

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
      <title>Research project data field analysis</title>
      <!--Chart.js JS CDN-->
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`


  htmlReport += '</head><body>';
  htmlReport += '<h1>Digital UX - Research project readiness report by faculty</h1>';
  htmlReport += '<div>Report date : ' + today + '</div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>Number of research projects by faculty </h2>';
  htmlReport += '<div> </div>';
  htmlReport += '<div><canvas id="myChart" style="height:50%;max-height:400" style="width:75%;max-width:600px"></canvas></div>';
  htmlReport += '<br>';
  htmlReport += '<hr>';
  htmlReport += '<h2>Faculty progress</h2>';
  htmlReport += '<div>Select your faculty below to see the current progress.  </div>';
  htmlReport += '<br>';
  htmlReport += '<div>Research projects are grouped by faculty and school. The faculty and school data is based on a project\'s lead researcher.  Some research projects do not have a faculty and school assigned and the \'Faculty not set\' report contains more details.  </div>';
  htmlReport += '<br>';
  htmlReport += '<div>Some data fields will not apply to every research project.  See further information in the faculty report.  Use this report as a general guide to research project readiness only.  </div>';
  htmlReport += '<br><ul>';
  htmlReport += '<li><a href="research-projects-faculty-progress-faculty-of-arts-and-humanities.html" > Faculty of Arts and Humanities</a>';
  htmlReport += '<li><a href="research-projects-faculty-progress-faculty-of-engineering-and-physical-sciences.html" > Faculty of Engineering and Physical Sciences</a>';
  htmlReport += '<li><a href="research-projects-faculty-progress-faculty-of-environmental-and-life-sciences.html" > Faculty of Environmental and Life Sciences</a>';
  htmlReport += '<li><a href="research-projects-faculty-progress-faculty-of-medicine.html" > Faculty of Medicine</a>';
  htmlReport += '<li><a href="research-projects-faculty-progress-faculty-of-social-sciences.html" > Faculty of Social Sciences</a>';
  htmlReport += '<li><a href="research-projects-faculty-progress-faculty-not-set.html" > Faculty not set</a>';
  htmlReport += '</ul>';
  htmlReport += '<hr>';

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
            labels: [${FACULTIES}],
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
            labels: [${FACULTIES}],
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
  htmlReport += '</body></html>';
  fs.writeFileSync(REPORTS_DATA_FOLDER + 'research-projects/faculty-progress/html/research-projects-faculty-progress.html', htmlReport);

  return htmlReport;
}




function generateHTMLReport(facultyReportData, faculty, schools, departments, profileCount) {

  //setup html report with standard content
  var htmlReport = setupHTMLReport(faculty);

  //if 'no faculty set' sort by schood/departments
  if (faculty == 'Faculty not set') {

    facultyReportData.sort(function (a, b) {
      return b[36] - a[36];
    })
  }

  //add detailed section to the the html report
  htmlReport += '<div id="jumptotop"</div>';
  htmlReport += '<h2>Detailed readiness by research project</h2>';
  htmlReport += '<div>The ' + faculty + ' has ' + profileCount + ' research projects. </div>';
  htmlReport += '<br>';
  htmlReport += '<div>The tables below illustrate the current state of individual research project pages. </div>';
  htmlReport += '<br>';
  htmlReport += '<div>The report identifies which fields contain data for each member research project in your faculty. The report is broken down by school. </div>';
  //htmlReport += '<br>';
  htmlReport += '<ul><li>YES = data exists on the research project page. ';
  htmlReport += '<li>NO = data does not exist on the research project page.  The project lead researcher needs to update their project in \'Pure\' using the instructions above. </ul>';
  //htmlReport += '<br>';
  htmlReport += '<br>';
  htmlReport += '<div id="jumptotop"</div>';
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
  htmlReport += '<br><br>';

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
    htmlReport += '<div><a href="#jumptotop">Jump to top</a></div>';
    htmlReport += '<br>';

    if (facultyReportData[faculty][school] != undefined) {

      var data = facultyReportData[faculty][school];
      var profileData = [];

      profileData.push(['Project title', 'Status', 'Funder', 'Lead researcher name', 'Data index (26)', 'Title', 'Research area', 'Research groups', 'Lead researcher', 'Other researches', 'Research funder', 'Research website', 'Research status', 'Research overview', 'Research lead researcher', 'Research other researchers', 'Research outputs', 'Research partners']);

      data.forEach(element => {

        //create array
        var theProfile = element.toString().split(',');

        //add 
        /*if (faculty == 'Faculty not set') {

            if (theProfile[35] != '') {
                tempcount++;
            }
        }
        */

        //add profile to array for html tables
        profileData.push(theProfile);

        //add profile to array for graph
        facultyProfiles.push([theProfile]);

        //tally number of profiles
        count++;
      })

      //console.log(profileData);

      //add a table array to the html report
      htmlReport += htmlFunctions.generateTable(profileData);
      htmlReport += '<br>';
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
  const TITLE = "RESEARCH PROJECTS PROGRESS FOR " + faculty.toUpperCase() + ' - ' + TOTAL + ' PROFILES';

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
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`;


  htmlReport += '</head><body>';
  htmlReport += '<h1>Digital UX - Research project readiness report - ' + faculty + '</h1>';
  //htmlReport += '<br>';
  //htmlReport += '<h2>Report date : ' + today + '</h2>';
  htmlReport += '<div>Report date : ' + today + '</div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>How to use this report</h2>';
  htmlReport += '<div>The new research projects are driven by data from \'Pure\'.  Project leads update \'Pure\' and the data automatically displays on their research project page.  </div>';
  htmlReport += '<br>';
  htmlReport += '<div>A research project page is made up of 13 data fields.  </div>';
  htmlReport += '<div><ul>';
  htmlReport += '<li>9 fields are driven by data from \'Pure\'.  Lead researchers update their project data in \'Pure\' and it will automatically display on their research project';
  htmlReport += '<li>3 fields are controlled by the Digital User Experience team.  No further action is needed.';
  htmlReport += '<div></ul>';
  htmlReport += 'The <a href="https://sotonac.sharepoint.com/teams/research-project-guidance"  target="_blank" > resease project guidance</a> Sharepoint site provides help and assitance needed for lead researchers to update their research project page.';
  htmlReport += '<hr>';
  htmlReport += '<h2>Summary of progress</h2>';
  htmlReport += '<div>The chart below illustrates your faculty\'s current research project readiness.  It shows the number of data fields containing data across all research projects assigned to your faculty (based on a project\'s lead researcher).   </div>';
  htmlReport += '<br>';
  htmlReport += '<div>Not all data fields will apply to every research project.  Use this chart as a general guide to readiness only.  </div>';
  htmlReport += '<br>';
  htmlReport += '<div><canvas id="myChart" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas></div>';
  htmlReport += '<br>';
  htmlReport += '<hr>';

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

        console.log(funder);

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
    console.log(funder + ' --> ' + funderTotals[funder])

    graphLabels.push('"' + funder + '"');
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
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`;


  htmlReport += '</head><body>';
  htmlReport += '<h1>Digital UX - Research project funder analysis</h1>';
  //htmlReport += '<br>';
  //htmlReport += '<h2>Report date : ' + today + '</h2>';
  htmlReport += '<div>Report date : ' + today + '</div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>Funder summary</h2>';
  htmlReport += '<div>A summary of all funders associated with research projects.  There are ' + funderList.length + ' funders.</div>';
  htmlReport += '<br>';
  htmlReport += '<div><canvas id="myChart" style="height:75%;max-height:600" style="width:75%;max-width:1200px"></canvas></div>';
  htmlReport += '<hr>';
  htmlReport += '<h2>List of projects for each funder</h2>';
  htmlReport += '<div>A list of research projects associated with a funder.  </div>';
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
            blue: 'rgb(54, 162, 235)',
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


  fs.writeFileSync(REPORTS_DATA_FOLDER + 'research-projects/faculty-progress/html/research-projects-funder-analysis.html', htmlReport);
}



//read in projects data
//read in staff person data
//create array of projects, faculty and school
var researchProjectData = getResearchProjectData();

//create project faculty report for projects
//create index page
generateReportByFaculty(researchProjectData);

//generate faculty dashboard
generateFunderReport(researchProjectData);






