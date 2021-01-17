const path = require('path');
const express = require('express');
const hbs = require('hbs');
const request = require('request');
const bodyParser = require('body-parser');
const { addToJson, checkIfInJson } = require('./logic');
require('./logic');

// Establishing the server
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
const port = process.env.PORT || 3000;

// Establishing routes to views directory
const viewsPath = path.join(__dirname, '../templates/views');

// setup handlebars, engine, views locations
app.set('view engine', 'hbs');
app.set('views', viewsPath);

// setup static dir to serve
app.use(express.static(path.join(__dirname, `../public`)));

//Establishing the routers for app.get
app.get('', (req, res) => {
    res.render('index', {});
});

app.post('/room', (req, res) => {
    // console.log(req.body.id);
    addToJson(req.body.id);
    // res.redirect('/room/:id');
});
app.get('/room/:id', (req, res) => {
    // sprawdzam czy id znajduje sie w jsonie aktualnie stworzonych pokojow, jesli tak to pozwalam sie podlaczyc
    // jak uzytkownik wychodzi to sprawdzam w socketIO ile ludzi podlaczonych jest aktualnie do pokoju
    // console.log(req.params.id);
    // console.log(checkIfInJson(req.params.id));
    if (!checkIfInJson(req.params.id)) return res.send('no found');

    res.render('room', {});
});
app.get('*', (req, res) => {
    res.send('404', {
        title: 'page not found',
        pageName: '404 error',
    });
});

// Deploying server
app.listen(port, () => {
    console.log(`server is up on port ${port}`);
});
