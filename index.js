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
  try {
    const today = new Date().toISOString().split('T');
    const targetDate = req.query['date'] ? req.query['date'] : today[0];
    //const startWeek = getWeekStart(targetDate);
    //const startString = startWeek.toISOString().split('T');
    //startWeek.setDate(startWeek.getDate() + 6);
    //const endString = startWeek.toISOString().split('T');
    //const urlString = 'https://rest.tsheets.com/api/v1/timesheets?on_the_clock=both&start_date=' + startString[0] + '&end_date=' + endString[0];
    const urlString = 'https://rest.tsheets.com/api/v1/timesheets?on_the_clock=both&start_date=' + targetDate
    console.log('Calling URL: ' + urlString);
    const options = {
      url: urlString,
      headers: {
        'Authorization': 'Bearer S.4__ae3083c841d0d9c1850c5186cc64aba675671ae2'
      }
    };
    res.header('Content-Type', 'application/json');
    const request = require('request');
    request(options, function (error, response, body) {
      // return a mapping of job ids to either the parent name or the job's name (both in object)
      const bodyData = JSON.parse(body);
      const jobDictionary = makeDictionary(bodyData);
      const timesheetData = bodyData['results']['timesheets'];

      const dateSortedTimeEntries = {};
      Object.keys(timesheetData).forEach(entryId => {
        if (!dateSortedTimeEntries[timesheetData[entryId]['date']]) {
          dateSortedTimeEntries[timesheetData[entryId]['date']] = [];
        }
        dateSortedTimeEntries[timesheetData[entryId]['date']].push(timesheetData[entryId]);
      });

      res.send(processData(dateSortedTimeEntries, jobDictionary));
    });
  } catch (err) {
    res.send(err);
  }
}

function processData(timesheetData, jobDictionary) {
  Object.keys(timesheetData).forEach((date) => {
    timesheetData[date] = summarizeTimePerJob(timesheetData[date], jobDictionary);

    Object.keys(timesheetData[date]['summary']).forEach(jobId => {
      timesheetData[date]['summary'][jobId] = Math.round((timesheetData[date]['summary'][jobId] / (60*60)) * 100) / 100;
    });
    const nonBillable = timesheetData[date]['summary']['Non-billable'] ? timesheetData[date]['summary']['Non-billable'] : 0;
    const billable = timesheetData[date]['summary']['Billable'] ? timesheetData[date]['summary']['Billable'] : 0;
    timesheetData[date]['summary']['workHours'] = nonBillable + billable;
    timesheetData[date]['summary']['trackingUtilization'] = Math.round(billable / Math.min(nonBillable + billable, 8) * 100);
    timesheetData[date]['summary']['dailyUtilization'] = Math.round(billable / 8 * 100);

    Object.keys(timesheetData[date]['detail']).forEach(jobId => {
      timesheetData[date]['detail'][jobId]['time'] = Math.round((timesheetData[date]['detail'][jobId]['time'] / (60*60)) * 100) / 100;
    });
  });

  return timesheetData;
}

function getWeekStart(target) {
  if(target !== typeof Date) {
    target = new Date(target);
  }
  const adjustedDayNum = target.getDay() === 0 ? 7 : target.getDay();
  target.setDate(target.getDate() - (adjustedDayNum - 1));
  return target;
}

function onPost(req, res) {
    console.log(req.body);
    res.send('Hello World - POST');
}

function summarizeTimePerJob (timesheetData, mapping) {
  const now = new Date();
  const timePerJob = {
    summary: {},
    detail: {}
  };

  timesheetData.forEach((entryObject) => {
    let duration;
    let notes = entryObject['notes'] ? ' ' + entryObject['notes'] : entryObject['notes'];
    const jobId = entryObject['jobcode_id'];
    const parent = mapping['idToParentName'][jobId];
    const linkName = mapping['idToLink'][jobId];

    if(entryObject['on_the_clock']) {
      duration = (now - Date.parse(entryObject['start'])) / 1000;
      console.log('Duration calculation, seconds = ' + duration);
    } else {
      duration = parseInt(entryObject['duration']);
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

function makeDictionary (bodyData) {
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
