(function() {
"use strict";

var saatchiMusic = saatchiMusic || {};

var PLAYLIST_ID = 132348750,
    USER_ID = 166910789;

var tracks = [],
    player,
    playlist,
    currentTrack,
    playlistAPI;

saatchiMusic.init = function() {
    var connectButton = document.querySelector('.js-connect');

    connectButton.addEventListener('click', soundCloudLogin);

    player = saatchiMusic.player();
    playlist = saatchiMusic.playlist();

    function soundCloudLogin() {
        SC.initialize({
            client_id: 'a7d2d4f9bbd96add03c6b873e39abbf3',
            redirect_uri: 'http://local.office-music-player.co.uk/callback.html'
        }).connect(function(){
            saatchiMusic.search();
            playlist.getPlaylist();
        });
    }
}

saatchiMusic.timeInMinutes = function(time) {
    var minutes = Math.floor(time / 60000),
        seconds = ((time % 60000) / 1000).toFixed(0);

  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

saatchiMusic.search = function() {
    var searchInput = document.querySelector('.js-search-input'),
        timer = null;

    searchInput.addEventListener('keyup', function() {
        clearTimeout(timer);
        timer = this.value.length ? setTimeout(soundcloudSearch, 250) : null;
    });

    function soundcloudSearch() {
        var searchTerm = searchInput.value;

        SC.get('/tracks', {
            q: searchTerm,
            duration: {
                from: 60000,
                to: 600000
            }
        }, function(tracks) {
            renderSearchResults(tracks);
        });
    }

    function renderSearchResults(results) {
        var searchResultList = document.querySelector('.js-search-result-list');

        while (searchResultList.firstChild) {
            searchResultList.removeChild(searchResultList.firstChild);
        }

        results.map(function(result) {
            var listItem = document.createElement('li'),
                listItemLink = document.createElement('a'),
                listItemText = document.createTextNode(result.title);

            listItemLink.appendChild(listItemText); 
            listItem.appendChild(listItemLink); 

            listItem.addEventListener('click', function(){
                playlist.addTrack(result);
                // listItem.className = "current-track";
                // saatchiMusic.playTrack(result);
            });

            searchResultList.appendChild(listItem);
        });
    }
}

saatchiMusic.playlist = function() {

    function addTrack(track) {
        tracks.push(track);
        SC.put('/playlists/' + PLAYLIST_ID, { playlist: { tracks: [track.id] }});
       
        getPlaylist();
    }

    function removeTrack() {
        tracks.shift();
        renderPlaylist();
    }

    function skipTrack() {
        currentTrack.stop();
        player.playNext();
    }

    function getPlaylist() {
        SC.get('/playlists/'+ PLAYLIST_ID, function(playlist) {
            playlistAPI = playlist;
            tracks = playlist.tracks;
            renderPlaylist();
            player.play(tracks[0]);
        });
    }

    function renderPlaylist() {
        var playlistTracks = document.querySelector('.js-tracklist');

        while (playlistTracks.firstChild) {
            playlistTracks.removeChild(playlistTracks.firstChild);
        }

        tracks.map(function(track) {
            var playlistItem = document.createElement('tr'),
                playlistItemTitle = document.createElement('td'),
                playlistItemTitleText = document.createTextNode(track.title),
                playlistItemTime = document.createElement('td'),
                playlistItemTimeText = document.createTextNode(saatchiMusic.timeInMinutes(track.duration));

            playlistItemTitle.appendChild(playlistItemTitleText);
            playlistItemTime.appendChild(playlistItemTimeText);
            playlistItem.appendChild(playlistItemTitle);
            playlistItem.appendChild(playlistItemTime);

            playlistItem.addEventListener('click', function(){
                saatchiMusic.requestSkip(track);
            });

            playlistTracks.appendChild(playlistItem);
        });
    }

    return {
        addTrack: addTrack,
        removeTrack: removeTrack,
        skipTrack: skipTrack,
        renderPlaylist: renderPlaylist,
        getPlaylist: getPlaylist
    }
}

saatchiMusic.player = function() {

    function play(track) {
        SC.stream('/tracks/' + track.id, function(sound) {
            currentTrack = sound;

            currentTrack.play({
                onfinish: playNext
            });
        });
    }

    function playNext() {
        playlist.removeTrack();

        if (!tracks.length) {
            return false;
        }

        play(tracks[0]);
    }

    return {
        play: play
    }
}

saatchiMusic.init();

})();