var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    DB = {};

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

DB.updateUsers = function(user) {
    var users = this.getUsers();

    if (this.isDuplicate(users, user, "id")) {
        return users;
    }

    users.push(user);

    this.writeFile(path.join(__dirname, '../', 'data/users.json'), users);

    return users;
}

DB.isDuplicate = function(list, item, key) {
    for (var i = 0, len = list.length; i < len; i++) {
        var listItem = list[i];

        if (listItem[key] === item[key]) {
            return true;
        } 
    }
    return false;
}

DB.getPlaylist = function() {
    var playlist = JSON.parse(this.getFile(path.join(__dirname, '../', 'data/playlist.json')));

    return playlist;
}

DB.getPlaylistWithUser = function(playlist) {
    var users = this.getUsers(),
        playlist = (typeof playlist !== 'undefined') ? playlist : this.getPlaylist();

    playlist.tracks = _.map(playlist.tracks, function(track) {
        track.added_by = _.findWhere(users, {id: track.added_by});
        return track;
    });

    return playlist;
}

DB.updatePlaylist = function(track) {
    var playlist = this.getPlaylist();

    if (this.isDuplicate(playlist.tracks, track, "id")) {
        return this.getPlaylistWithUser(playlist);
    }

    playlist.tracks.push(track);

    this.writeFile(path.join(__dirname, '../', 'data/playlist.json'), playlist);

    return this.getPlaylistWithUser(playlist);
}

DB.removePlaylistItem = function(id, source, destination) {

    var playlist = this.getPlaylist();

    playlist[source].tracks = playlist[source].tracks.filter(function(track) {
        if (track.id !== id * 1) {
            return true;
        }
        playlist[destination].tracks.push(track);
        return false;
    });

    this.writeFile(path.join(__dirname, '../', 'data/playlist.json'), playlist);

    return this.getPlaylistWithUser(playlist['main']);
}

module.exports = DB;