const express = require('express');
const app = express();

app.get('/', (req, res)=> {
    console.log('Req = ' + req);
    res.send('Hello world!');
});

app.post('/', (req, res)=> {
    console.log('Req = ' + req);
    res.send('Hello world!');
});

app.listen(process.env.PORT | 3000, () => console.log('Example app listening on port ' + process.env.PORT + '!'));

