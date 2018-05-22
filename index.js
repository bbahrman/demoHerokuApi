const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app
    .get('/', onGet)
    .post('/', onPost)
    .listen(PORT, () => console.log(`Listening on ${ PORT }`));

function onGet (req, res) {
    res.send('Hello world - GET')
}

function onPost(req, res) {
   res.send('Hello World - POST');
}