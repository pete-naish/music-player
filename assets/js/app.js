(function() {
    "use strict";

    var saatchiMusic = saatchiMusic || {};

    var tracks = [],
        player,
        allPlaylists,
        playlist,
        currentTrack,
        currentUser,
        playing = false,
        socket = io();

    saatchiMusic.utilities = {
        ajax: function(data) {
                var httpRequest = new XMLHttpRequest();

                httpRequest.onload = handleResponse;
                httpRequest.open(data.method, data.url);
                httpRequest.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
                httpRequest.setRequestHeader('user', currentUser.id);
                httpRequest.send(JSON.stringify(data.data));

                function handleResponse() {
                    var response;

                    if (httpRequest.status === 200) {
                        response = JSON.parse(httpRequest.response);

                        if (typeof data.callback === "function") {
                            data.callback(response);
                        }
                    }
                }
        },
        pluck: function(obj, keys) {
            var data = {};

            keys.forEach(function(key) { 
                if (typeof key === 'string' && obj.hasOwnProperty(key)) {
                    data[key] = obj[key];
                } else if (typeof key === 'object'){
                    data[Object.keys(key)] = key[Object.keys(key)]; 
                }
            });

            return data;
        },
        timeInMinutes: function(time) {
            var minutes = Math.floor(time / 60000),
                seconds = ((time % 60000) / 1000).toFixed(0);

          return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
        }
    }

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
                saatchiMusic.getCurrentUser();
            });
        }
    }

    saatchiMusic.getCurrentUser = function() {
        SC.get('/me', function(me) {
            currentUser = me;
            saveUser();
            playlist.getPlaylist();
        });

        function saveUser() {
            saatchiMusic.utilities.ajax({
                method: 'POST',
                url: '/users',
                data: saatchiMusic.utilities.pluck(currentUser, ['avatar_url', 'id', 'permalink_url', 'username']),
                callback: function(response) {
                    // console.log('success');
                } 
            });
        }
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
                    // from: 60000,
                    // to: 600000

                    from: 60,
                    to: 10000
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
                });

                searchResultList.appendChild(listItem);
            });
        }
    }

    saatchiMusic.playlist = function() {
        socket.on('playlist_updated', function(data) {
            if (data.user !== currentUser) {
                apiCallback(data.data);
            }
        });

        function addTrack(track) {
            var data = saatchiMusic.utilities.pluck(track, ['title', 'duration', 'artwork_url', 'id', {'added_by': currentUser.id}]);
            syncPlaylist('/playlist', data);
        }

        function removeTrack() {
            syncPlaylist('/playlist/' + tracks[0].id);
            tracks.shift();
        }

        function skipTrack() {
            currentTrack.stop();
            player.playNext();
        }

        function getPlaylist() {
            saatchiMusic.utilities.ajax({
                method: 'GET',
                url: '/playlist',
                data: {},
                callback: apiCallback
            });     
        }

        function syncPlaylist(url, data) {
            saatchiMusic.utilities.ajax({
                method: 'POST',
                url: url,
                data: data || {},
                callback: apiCallback
            });
        }

        function apiCallback(response) {
            allPlaylists = response;
            tracks = response.main.tracks;

            renderPlaylist();

            if (!playing) {
                player.play(tracks[0]);
            }
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
                    playlistItemTimeText = document.createTextNode(saatchiMusic.utilities.timeInMinutes(track.duration));

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
            if (!track || playing) {
                return false;
            }

            playing = true;

            SC.stream('/tracks/' + track.id, function(sound) {
                var currentTrackAudio;

                currentTrack = sound;

                // fix bug in soundcloud api where onfinish is not called
                currentTrackAudio = currentTrack._player._html5Audio;

                currentTrackAudio.addEventListener('ended', playNext);

                currentTrack.play();
            });
        }

        function playNext() {
            playing = false;

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