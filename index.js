const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 5000;

app
    .use(bodyParser.json())
    .get('/', onGet)
    .post('/', onPost)
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));

function onGet (req, res) {
    res.send('Hello world - GET')
}

function onPost(req, res) {
    console.log(req.body);
    res.send('Hello World - POST');
}