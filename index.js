const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 5000;

app
  .use(bodyParser.json())
  .use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  })
  .get('/', onGet)
  .get('/test', onGet)
  .post('/', onPost)
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

function onGet (req, res) {
  console.log('Entering onGet');
  const today = new Date().toISOString().split('T');
  const options = {
    url: 'https://rest.tsheets.com/api/v1/timesheets?start_date=' + today[0],
    headers: {
      'Authorization': 'Bearer S.4__ae3083c841d0d9c1850c5186cc64aba675671ae2'
    }
  };
  console.log('Setting header');
  res.header('Content-Type', 'application/json');
  console.log('Define request');
  const request = require('request');
  console.log('Calling request');
  request(options, function (error, response, body) {
    console.log('Response returned from remote, processing response object');
    const finalData = processData(body);
    res.send(finalData);
  });
  console.log('End onGet');
}

function onPost(req, res) {
    console.log(req.body);
    res.send('Hello World - POST');
}

function processData (responseBody) {
  const bodyData = JSON.parse(responseBody);
  const timePerJob = {};
  const timesheetData = bodyData['results']['timesheets'];
  const jobCodeData = bodyData['supplemental_data']['jobcodes'];
  const jobCodeDictionary = {};

  Object.keys(timesheetData).forEach((entryId) => {
    console.log(timesheetData[entryId]['duration']);
    timePerJob[timesheetData[entryId]['jobcode_id']] = timePerJob[timesheetData[entryId]['jobcode_id']] ? timePerJob[timesheetData[entryId]['jobcode_id']] + parseInt(timesheetData[entryId]['duration']) : parseInt(timesheetData[entryId]['duration']);
  });

  const parentIdToName = {};
  Object.keys(jobCodeData).forEach(jobId => {
    if(jobCodeData[jobId]['has_children']) {
      parentIdToName[jobId] = jobCodeData[jobId]['name'];
    }
  });

  Object.keys(jobCodeData).forEach(jobId => {
    if(!jobCodeData[jobId]['has_children'] && jobCodeData[jobId]['parent_id'] !== 0) {
      jobCodeDictionary[jobId] = parentIdToName[jobCodeData[jobId]['parent_id']];
    } else {
      jobCodeDictionary[jobId] = jobCodeData[jobId]['name'];
    }
  });
  const finalData = {};
  Object.keys(timePerJob).forEach(jobId => {
    finalData[jobCodeDictionary[jobId]] = finalData[jobCodeDictionary[jobId]] ? finalData[jobCodeDictionary[jobId]] + timePerJob[jobId] : timePerJob[jobId];
  });

  Object.keys(finalData).forEach(jobId => {
    finalData[jobId] = Math.round((finalData[jobId] / (60*60)) * 100) / 100;
  });

  return finalData;
}