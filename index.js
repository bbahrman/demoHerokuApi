const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    console.log('Get Req = ' + req);
    res.send('Hello world!');
}).post('/', (req, res) => {
    console.log('Post Req = ' + req);
    res.send('Hello world!');
}).listen(PORT, () => console.log(`Listening on ${ PORT }`));


