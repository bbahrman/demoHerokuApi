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
  const options = {
    url: 'https://rest.tsheets.com/api/v1/timesheets?start_date=2018-06-07',
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
    const bodyData = JSON.parse(body);
    res.send(bodyData['results']['timesheets']);
  });
  console.log('End onGet');
}

function onPost(req, res) {
    console.log(req.body);
    res.send('Hello World - POST');
}

async function returnData () {

}