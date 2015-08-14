var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    DB = {};

DB.setSockets = function(socket) {
    this.socket = socket;
}

DB.sendSockets = function(event, data) {
    if (!this.socket) {
        return false;
    }

    this.socket.emit(event, data);
}

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

DB.vote = function(req) {
    var playlist = this.getPlaylist(),
        trackId = req.params.id,
        dir = ((req.params.dir === "up") ? 1 : -1),
        user = req.headers.user,
        _track;

    _.each(playlist.main.tracks, function(track){
        var indexUpVoted,
            indexDownVoted,
            userHasUpvoted,
            userHasDownVoted;

        if (track.id === (trackId * 1)) {

            // Set votes if null
            track.votes = track.votes || [];
            track.voteCount = track.voteCount || 0;

            var voted = _.findWhere(track.votes, {'user': user});

            voted = {user: 'yesy', type: 1}

            if(!voted){
                // Do as normal
                if(dir === -1){
                    return false;
                }
            }
            else{
                // Remove all use data to date from this object
                track.votes = _.filter(track.votes, function(vote){
                    return vote.user !== user;
                })
                // Switch state of vote
                dir = dir*-1;
            }

            track.votes.push({user: user, type: dir});
            var pos_votes =  _.findWhere(track.votes, {type: 1}) || [];
            track.voteCount = pos_votes.length;
            _track = track;

            if (track.vote === 3) {
                DB.bumpTrack(_track);
            } else if (track.vote === -3) {
                DB.dumpTrack(_track);
            }
        }
    });

    if(!_track){
        return false;
    }

    this.writeFile(path.join(__dirname, '../', 'data/playlist.json'), playlist);

    this.sendSockets('votes_updated', { data: _track, user: user });

    return _track;    
}

DB.bumpTrack = function(track) {
    DB.sendSockets('bump_track', { data: track });
}

DB.dumpTrack = function(track) {
    DB.sendSockets('dump_track', { data: track });
}

DB.getPlaylist = function() {
    var playlist = JSON.parse(this.getFile(path.join(__dirname, '../', 'data/playlist.json')));

    return playlist;
}

DB.getPlaylistWithUser = function(playlist) {
    var users = this.getUsers(),
        playlist = (typeof playlist !== 'undefined') ? playlist : this.getPlaylist(); // only get the playlist again if it hasn't already been fetched

    playlist.main.tracks = _.map(playlist.main.tracks, function(track) {
        // replace the added_by id with the actual user object from the users json
        track.added_by = _.findWhere(users, {id: track.added_by});
        return track;
    });

    return playlist;
}

DB.updatePlaylist = function(req) {
    var playlist = this.getPlaylist(),
        track = req.body,
        user = req.headers.user;

    // if the track is a duplicate, just return existing playlist and do not go further
    if (this.isDuplicate(playlist.main.tracks, track, "id")) {
        return this.getPlaylistWithUser(playlist);
    }

    // add new track to main playlist
    playlist.main.tracks.push(track);

    this.writeFile(path.join(__dirname, '../', 'data/playlist.json'), playlist);

    // emit event to update client screens
    this.sendSockets('playlist_updated', { data: this.getPlaylistWithUser(playlist), user: user });

    // return whole playlist with user details
    return this.getPlaylistWithUser(playlist);
}

DB.removePlaylistItem = function(req, source, destination) {
    var id = req.params.id,
        user = req.headers.user,
        playlist = this.getPlaylist();

    // this removes matching items from the source playlist and adds to destination playlist
    playlist[source].tracks = playlist[source].tracks.filter(function(track) {
        if (track.id !== id * 1) {
            return true;
        }
        // only add to recent if it's not a duplicate
        if (!DB.isDuplicate(playlist.recent.tracks, track, "id")) {
            playlist[destination].tracks.push(track);
        }
        return false;
    });

    // keep recent tracks to 10 items
    playlist.recent.tracks = playlist.recent.tracks.slice(-10);

    // write whole playlist
    this.writeFile(path.join(__dirname, '../', 'data/playlist.json'), playlist);

    // emit event to update client screens
    this.sendSockets('playlist_updated', { data: this.getPlaylistWithUser(playlist), user: user });

    // return the whole playlist with user details
    return this.getPlaylistWithUser(playlist);
}

module.exports = DB;