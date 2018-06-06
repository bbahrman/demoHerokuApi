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
  .post('/', onPost)
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

function onGet (req, res) {
    res.send([{'test':'val'}]);
    res.header('Content-Type', 'application/json');
    res.send({'message': 'success'});
}

function onPost(req, res) {
    console.log(req.body);
    res.send('Hello World - POST');
}