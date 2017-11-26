// ENVIRONMENT VARIABLES
const port = process.env.PORT || 3000;

const express = require('express');
const app = express();
const path = require('path');

app.set('views', __dirname + '/');
app.engine('html', require('ejs').renderFile);

app.listen(port, function(){
    console.log('Example app listening on port 3000!')
});

// STATIC FILES
app.use('/',express.static(path.join(__dirname, 'public')));

// ROUTING
app.get('/', function(req, res) {
    res.render('index.html');
});
