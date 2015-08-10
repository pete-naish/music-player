var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var DB = {};

DB.getFile = function(file) {
    return fs.readFileSync(file).toString();
}

DB.writeFile = function(url, data) {
    fs.writeFileSync(url, JSON.stringify(data, null, 4));
}

DB.getUsers = function() {
    var users = JSON.parse(this.getFile(path.join(__dirname, '../', 'data/users.json')));

    return users;
}

DB.getUser = function(id) {
    var users = this.getUsers();

    return _.findWhere(users, {id: id});
}

DB.getPlaylist = function() {
    var playlist = JSON.parse(this.getFile(path.join(__dirname, '../', 'data/playlist.json')));

    return playlist;
}

DB.getPlaylistWithUser = function() {
    var users = this.getUsers();
    var playlist = this.getPlaylist();

    playlist.tracks = _.map(playlist.tracks, function(track) {
        track.added_by = _.findWhere(users, {id: track.added_by});
        return track;
    });

    return playlist;
}

DB.updatePlaylist = function(track) {
    var playlist = this.getPlaylist();

    console.log(playlist);
    playlist.tracks.push(track);

    this.writeFile(path.join(__dirname, '../', 'data/playlist.json'), playlist);
}

module.exports = DB;