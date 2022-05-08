const fs = require('fs');

var csvSourceFile = './subjects-courses-mapping.csv';
var csvOutputFile = 'VisualRegressionURLs.json';

//read text file
//var textFile = fs.readFileSync(textFile);
var textFile = [];
textFile = fs.readFileSync(csvSourceFile).toString().split("\n");

var courses = [];

textFile.forEach(textFileRow => {
    var textFileRowArray = textFileRow.toString().split(',');
    var subject = textFileRowArray[0]
    var coursesText = textFileRowArray[3];

    if (coursesText != undefined) {
        var courseList = coursesText.toString().split('*');

        var count = 0;
        courseList.forEach(course => {

            course = course.replace(/"/g, '');

            if (count == 0) {
                //courses.push(['** ' + subject + ' **', course]);
                courses.push([subject, course]);
                count = 1;
            } else {
                courses.push(['', course]);
            }

            // if (courses[subject] == undefined) {
            //     courses[subject] = [];
            // }

            // //remove "
            // course = course.replace(/"/g, '');
            // courses[subject].push(course);
        })

    }

    //console.log('Subject ' + subject + ' has ' + courses.length + ' courses');
    console.log(courses);



    var csv = courses.map(function (d) {
        return d.join();
    }).join('\n');
    fs.writeFileSync('subject-course-mapping-final.csv', csv);


})






//write json file
//const jsonString = JSON.stringify(textFile, null, 3);
//fs.writeFileSync(jsonFile, jsonString);


