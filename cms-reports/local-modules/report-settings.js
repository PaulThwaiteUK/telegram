//an easy way to define drupal domains in one place
//dev can use another server by uncommenting out the 'other' 

//set where to put report data and url lists
const REPORTS_DATA_FOLDER = '../../reports-data/';
const EXTERNAL_REPORTS_DATA_FOLDER = '../../reports-data/';
const URL_LISTS_FOLDER = '../../url-lists';

//globals to define the servers
var siteDomain = [];
siteDomain["prod"] = "https://oneweb.soton.ac.uk";
siteDomain["pprd"] = "https://oneweb.pprd.soton.ac.uk";
siteDomain["dev"] = "https://oneweb.dev.soton.ac.uk";
siteDomain["live"] = "https://www.southampton.ac.uk";
siteDomain["drupal9"] = "https://drupal9.soton.ac.uk";
//siteDomain["other"] = "https://add.other.domain";


//a getter to return the drupal domain
exports.getDomain = function (domain) {

    if (siteDomain[domain] != undefined) {
        return siteDomain[domain];
    } else {
        console.log('Error: The domain ' + domain + ' is not defined in cms-reports/local-modules/drupal-domains.js\n')
        process.exit();
    }
}

exports.getReportsFolder = function () {

    return REPORTS_DATA_FOLDER;
}

exports.getUrlListsFolder = function () {

    return URL_LISTS_FOLDER;
}


exports.getTimestamp = function (type, format) {

    let today = new Date();
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // adjust 0 before single digit date
    let today_date = ("0" + today.getDate()).slice(-2);
    let yesterday_date = ("0" + yesterday.getDate()).slice(-2);

    // current month
    let today_month = ("0" + (today.getMonth() + 1)).slice(-2);
    let today_month_long = ((today.toLocaleString('en-US', {month: 'short'})));
    let yesterday_month = ("0" + (yesterday.getMonth() + 1)).slice(-2);

    // current year
    let today_year = today.getFullYear();
    let yesterday_year = yesterday.getFullYear();

    // current hours
    let today_hours = today.getHours();
    let yesterday_hours = yesterday.getHours();

    // current minutes
    let today_minutes = today.getMinutes();
    let yesterday_minutes = yesterday.getMinutes();

    // current seconds
    let today_seconds = today.getSeconds();
    let yesterday_seconds = yesterday.getSeconds();

    if (type == 'today') {

        if (format == 'yymmdd') {

            return today_year + today_month + today_date;
        }

        if (format == 'yymmdd-hhmmss') {

            return today_year + today_month + today_date + "-" + today_hours + today_minutes + today_seconds;
        }

        if (format == 'ddmm') {

            return today_date + "/" + today_month;
        }

        if (format == 'dd mmm') {

            return today_date + " " + today_month_long;
        }
    }

    if (type == 'yesterday') {

        if (format == 'yymmdd') {

            return yesterday_year + yesterday_month + yesterday_date;
        }

        if (format == 'yymmdd-hhmmss') {

            return yesterday_year + yesterday_month + yesterday_date + "-" + yesterday_hours + yesterday_minutes + yesterday_seconds;
        }

        if (format == 'ddmm') {

            return yesterday_date + "/" + today_month;
        }
    }
}
