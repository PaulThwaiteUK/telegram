
exports.generateTable = function (data, tableid) {

    if (tableid != undefined) {
        var html = '<table id="' + tableid + '" border="1" cellpadding="6" cellspacing="5" style="border-collapse:collapse;">';
    } else {
        var html = '<table border="1" cellpadding="6" cellspacing="5" style="border-collapse:collapse;">';
    }

    if (typeof (data[0]) === 'undefined') {
        return null;
    }

    if (data[0].constructor === String) {
        html += '<tr>\r\n';
        for (var item in data) {
            if (data[item].indexOf('http') != -1) {
                var theURL = data[item];
                urllink = '<a href="' + theURL + '"> ' + theURL + '</a';
                data[item] = urllink;
            }
            html += '<td>' + data[item] + '</td>\r\n';
        }
        html += '</tr>\r\n';
    }

    if (data[0].constructor === Array) {
        var count = 0;
        var rowCount = 0;
        
        for (var row in data) {
            var width;
            html += '<tr>\r\n';
            for (var item in data[row]) {

                if (rowCount == 0) {
                    width = '';
                }
                else {
                    width = '';
                }

                data[row][item] = data[row][item].toString();
                if (data[row][item].indexOf('http') != -1) {
                    if (data[row][item].indexOf('href') == -1) {
                        var theURL = data[row][item];
                        urllink = '<a href="' + theURL + '" target="_blank"> ' + theURL + '</a';
                        data[row][item] = urllink;
                    }
                }
                var colour;
                var style;

                if (data[row][item].indexOf('YES')) {
                    colour = '#e6fff2';
                    style = 'center';
                }

                switch (data[row][item]) {
                    case 'NO':
                        colour = '#ffe6ff';
                        style = 'center';
                        break;

                    case 'YES':
                        colour = '#e6fff2';
                        style = 'center';
                        break;

                    case '404!':
                        colour = '#ff9999';
                        style = 'center';
                        break;

                    default:
                        colour = '#ffffff';
                        style = 'left';
                        break;


                }

                //bold the first row as the table header
                if (count == 0) {
                    html += '<td style="text-align:' + style + ';' + width + '; background-color:' + colour + ';"><b>' + data[row][item] + '</b></td>\r\n';
                }
                else {
                    html += '<td style="text-align:' + style + ';' + width + '; background-color:' + colour + ';">' + data[row][item] + '</td>\r\n';
                }
                rowCount++;
            }
            count++;
            html += '</tr>\r\n';
        }
    }

    if (data[0].constructor === Object) {
        for (var row in data) {
            html += '<tr>\r\n';
            for (var item in data[row]) {
                if (data[row][item].indexOf('http') != -1) {
                    var theURL = data[item];
                    urllink = '<a href="' + theURL + '" target="_blank"> ' + theURL + '</a';
                    data[row][item] = urllink;
                }

                var colour;
                var style;
                switch (data[row][item]) {
                    case 'NO':
                        colour = '#ffe6ff';
                        style = 'center';
                        break;

                    case 'YES':
                        colour = '#e6fff2';
                        style = 'center';
                        break;

                    case '404!':
                        colour = '#ff9999';
                        style = 'center';
                        break;

                    default:
                        colour = '#ffffff';
                        style = 'left';
                        break;
                }

                html += '<td style="text-align:' + style + '; style=background-color:' + colour + ';">' + item + ':' + data[row][item] + '</td>\r\n';

            }
            html += '</tr>\r\n';
        }
    }

    html += '</table>';
    return html;
}

