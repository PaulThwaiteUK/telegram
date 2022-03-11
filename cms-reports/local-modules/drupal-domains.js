//an easy way to define drupal domains in one place
//dev can use another server by uncommenting out the 'other' 

//set where to put report data and url lists
const REPORTS_DATA_FOLDER = '../../report-data';
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

    if (siteDomain[domain] != undefined)
    {
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



