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
  console.log('Entering onGet, req = ');
  console.log(req.query);
  const today = new Date().toISOString().split('T');
  const options = {
    url: 'https://rest.tsheets.com/api/v1/timesheets?on_the_clock=both&start_date=' + today[0],
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
    // return a mapping of job ids to either the parent name or the job's name (both in object)
    const jobDictionary = makeDictionary(body);
    // get
    const timePerJob = summarizeTimePerJob(body, jobDictionary);

    Object.keys(timePerJob['summary']).forEach(jobId => {
      timePerJob['summary'][jobId] = Math.round((timePerJob['summary'][jobId] / (60*60)) * 100) / 100;
    });

    Object.keys(timePerJob['detail']).forEach(jobId => {
      timePerJob['detail'][jobId]['time'] = Math.round((timePerJob['detail'][jobId]['time'] / (60*60)) * 100) / 100;
    });

    res.send(timePerJob);
  });
  console.log('End onGet');
}

function onPost(req, res) {
    console.log(req.body);
    res.send('Hello World - POST');
}

function summarizeTimePerJob (responseBody, mapping) {
  const bodyData = JSON.parse(responseBody);
  const timesheetData = bodyData['results']['timesheets'];
  const now = new Date();
  const timePerJob = {
    summary: {},
    detail: {}
  };

  Object.keys(timesheetData).forEach((entryId) => {
    let duration;
    const entryObject = timesheetData[entryId];
    let notes = entryObject['notes'] ? ' ' + entryObject['notes'] : entryObject['notes'];
    const jobId = entryObject['jobcode_id'];
    const parent = mapping['idToParentName'][jobId];
    const linkName = mapping['idToLink'][jobId];

    if(timesheetData[entryId]['on_the_clock']) {
      duration = (now - Date.parse(timesheetData[entryId]['start'])) / 1000;
      console.log('Duration calculation, seconds = ' + duration);
    } else {
      duration = parseInt(timesheetData[entryId]['duration']);
    }

    // add to parent duration to parent
    timePerJob.summary[parent] = timePerJob.summary[parent] ? timePerJob.summary[parent] + duration : duration;
    // fill details in
    if(!timePerJob['detail'][linkName]) {
      timePerJob['detail'][linkName] = {
        'time': 0,
        'notes': ''
      }
    }
    timePerJob.detail[linkName]['time'] = timePerJob.detail[linkName]['time'] + duration;
    timePerJob.detail[linkName]['notes'] = timePerJob.detail[linkName]['notes'] + notes;
  });
  console.log(timePerJob);
  return timePerJob;
}

function makeDictionary (responseBody) {
  const bodyData = JSON.parse(responseBody);
  const jobCodeData = bodyData['supplemental_data']['jobcodes'];
  const parentIdToName = {};
  const jobIdToLink = {};
  const jobCodeDictionary = {};

  // iterate through jobs
  Object.keys(jobCodeData).forEach(jobId => {
    if(jobCodeData[jobId]['has_children']) {
      parentIdToName[jobId] = jobCodeData[jobId]['name'];
    }
    const nameSplit = jobCodeData[jobId]['name'].split('|');
    jobIdToLink[jobId] = nameSplit[nameSplit.length -1].trim();
  });

  Object.keys(jobCodeData).forEach(jobId => {
    if(!jobCodeData[jobId]['has_children'] && jobCodeData[jobId]['parent_id'] !== 0) {
      jobCodeDictionary[jobId] = parentIdToName[jobCodeData[jobId]['parent_id']];
    } else {
      jobCodeDictionary[jobId] = jobCodeData[jobId]['name'];
    }
  });

  console.log(jobCodeDictionary);
  return {
    idToParentName: jobCodeDictionary,
    idToLink: jobIdToLink
  };
}
