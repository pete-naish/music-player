var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var DB = require('./api/file/file.js');

app.set('port', (process.env.PORT || 3000));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, 'assets')));

app.use("/",  express.static(__dirname + '/assets'));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname+"/index.html"));
});

app.get('/callback.html', function(req, res) {
  res.sendFile(path.join(__dirname+"/callback.html"));
});

app.get('/users', function(req, res) {
  res.send(DB.getUsers());
});

app.get('/users/:id', function(req, res) {
  res.send(DB.getUser(req.params.id));
});

app.get('/playlist', function(req, res) {
    res.send(DB.getPlaylistWithUser());
});

app.post('/playlist', function(req, res) {
    DB.updatePlaylist(req.body);
});

app.listen(app.get('port'), function() {
  console.log('Server started: http://localhost:' + app.get('port') + '/');
});