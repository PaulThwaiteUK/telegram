
const fetch = require('node-fetch');
const { Curl } = require('node-libcurl');

var COMMENT = '';

const bodyData = `{
    "visibility": {
      "type": "role",
      "value": "Administrators"
    },
    "body": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "text": "${COMMENT}",
              "type": "text"
            }
          ]
        }
      ]
    }
  }`;


exports.updateJIRATicket = function (ticketNumber, text) {

  var bodyData = `{
    "visibility": {
      "type": "role",
      "value": "Administrators"
    },
    "body": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "text": "${text}",
              "type": "text"
            }
          ]
        }
      ]
    }
  }`;

  fetch('https://oneweb-soton.atlassian.net/rest/api/3/issue/' + ticketNumber + '/comment', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(
        'paul.thwaite@soton.ac.uk:elVIXK3O5ETZzGhCzwKNF24E'
      ).toString('base64')}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: bodyData
  })
    .then(response => {
      console.log(
        `Jira response: ${response.status} `
      );
      return response.text();
    })
    .then(text => console.log(text))
    .catch(err => console.error(err));
}

exports.attachJiraTicket = async function (ticketNumber, attachment) {

  fetch('https://oneweb-soton.atlassian.net/rest/api/3/issue/' + ticketNumber + '/attachments', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(
        'paul.thwaite@soton.ac.uk:elVIXK3O5ETZzGhCzwKNF24E'
      ).toString('base64')}`,
      'Accept': 'application/text',
      'Content-Type': 'multipart/form-data',
      'X-Atlassian-Token': 'no-check',
      'charset': 'UTF-8'
    },
    body: attachment
  })
    .then(response => {
      console.log(
        `Response: ${response.status} ${response.statusText}`
      );
      return response.text();
    })
    .then(text => console.log(text))
    .catch(err => console.error(err));
}

exports.deleteAttachmentIDs = async function (ticketNumber) {

  fetch('https://oneweb-soton.atlassian.net/rest/api/3/issue/' + ticketNumber + '/?fields=attachment', {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(
        'paul.thwaite@soton.ac.uk:elVIXK3O5ETZzGhCzwKNF24E'
      ).toString('base64')}`,
      'Accept': 'application/json'
    }
  })
    .then(response => response.json())
    .then(data => {


      for (let index = 0; index < data.fields.attachment.length; index++) {
        attachmentID = data.fields.attachment[index].id;
        console.log('Deleting attachement ID ' + attachmentID);

        fetch('https://oneweb-soton.atlassian.net/rest/api/3/attachment/' + attachmentID, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${Buffer.from(
              'paul.thwaite@soton.ac.uk:elVIXK3O5ETZzGhCzwKNF24E'
            ).toString('base64')}`
          }
        })
          .then(response => {
            //console.log(
              //`Response: ${response.status} ${response.statusText}`
            //);
            return response.text();
          })
          //.then(text => console.log(text))
          .catch(err => console.error(err));
      }
    })
}


exports.addIssueAttachmentCurl = async function (filename, ticketNumber) {
  
  //output = curl -D- -u paul.thwaite@soton.ac.uk:elVIXK3O5ETZzGhCzwKNF24E -X POST -H "X-Atlassian-Token: no-check" -F "file=@educationReport.csv" https://oneweb-soton.atlassian.net/rest/api/3/issue/PST-25/attachments

  const curl = new Curl();
  const close = curl.close.bind(curl);
  
  //imageFilename = 'reports/educationReport_prod.csv';

  const data = [
    {
      name: 'filename',
      contents: 'Node.js Logo',
    },
    {
      name: 'file',
      file: filename,
      type: 'text/html',
    },
  ]
  
  //create the image file
  //fs.writeFileSync(imageFilename, buffer)
  
  curl.setOpt(Curl.option.URL, 'https://oneweb-soton.atlassian.net/rest/api/3/issue/' + ticketNumber + '/attachments')
  curl.setOpt(Curl.option.HTTPPOST, data)
  curl.setOpt(Curl.option.VERBOSE, false)
  curl.setOpt(Curl.option.USERNAME, "paul.thwaite@soton.ac.uk");
  curl.setOpt(Curl.option.PASSWORD, "elVIXK3O5ETZzGhCzwKNF24E");
  curl.setOpt(Curl.option.HTTPHEADER,
    ['X-Atlassian-Token: no-check'])
  
  curl.on('end', function (statusCode, body) {
    console.log('');
    console.log('Status of report upload:')
    console.log({
      statusCode,
      body: JSON.parse(body),
    })
  
    this.close()
    //fs.unlinkSync(imageFilename)
  })
  
  curl.on('error', function (error, errorCode) {
    console.error(error, errorCode)
  
    this.close()
    //fs.unlinkSync(imageFilename)
  })
  
  curl.perform()

}