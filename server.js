var fs = require('fs'),
path = require('path'),
express = require('express'),
bodyParser = require('body-parser'),
app = express(),
DB = require('./api/file/file.js');

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

app.post('/users', function(req, res) {
    res.send(DB.updateUsers(req.body));
});

app.get('/playlist', function(req, res) {
    res.send(DB.getPlaylistWithUser());
});

app.post('/playlist', function(req, res) {
    res.send(DB.updatePlaylist(req.body));
});

app.post('/playlist/:id', function(req, res) {
    res.send(DB.removePlaylistItem(req.params.id, 'main', 'recent')); 
});

app.listen(app.get('port'), function() {
    console.log('Server started: http://localhost:' + app.get('port') + '/');
});