const express = require('express');
const app = express();

app.get('/', (req, res)=> {
    console.log('Get Req = ' + req);
    res.send('Hello world!');
}).post('/', (req, res)=> {
    console.log('Post Req = ' + req);
    res.send('Hello world!');
}).listen(process.env.PORT | 3000, () => console.log('Example app listening on port ' + process.env.PORT + '!'));

