const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app
    .get('/', onGet)
    .post('/', onPost)
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));

function onGet (req, res) {
    console.log(req);
    res.send('Hello world - GET')
}

function onPost(req, res) {
    console.log(req);
    res.send('Hello World - POST');
}