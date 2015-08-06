var saatchiMusic = saatchiMusic || {};

saatchiMusic.auth = function() {
    var connectButton = document.querySelector('.js-connect');

    connectButton.addEventListener('click', soundCloudLogin);

    function soundCloudLogin() {
    }
}

        SC.initialize({
            client_id: 'a7d2d4f9bbd96add03c6b873e39abbf3',
            redirect_uri: 'http://local.office-music-player.co.uk/callback.html'
        });

        SC.connect(function(){
            saatchiMusic.search();
            // SC.get('/me', function(me) {
                // console.log('Hello ' + me.username);
            // });
        });
saatchiMusic.search = function() {
    var searchInput = document.querySelector('.js-search-input'),
        timer = null;

    searchInput.addEventListener('keyup', function() {
        clearTimeout(timer);
        timer = this.value.length ? setTimeout(soundCloudSearch, 250) : null;
    });

    function soundCloudSearch() {
        var searchTerm = searchInput.value;

        SC.get('/tracks', {
            q: searchTerm,
            duration: {
                from: 60000,
                to: 600000
            }
        }, function(tracks) {
            saatchiMusic.listSearchResults(tracks);
        });
    }
}

saatchiMusic.listSearchResults = function(results) {
    var searchResultList = document.querySelector('.js-search-result-list');

    // ruddy javascript!
    while (searchResultList.firstChild) {
        searchResultList.removeChild(searchResultList.firstChild);
    }
        

    results.map(function(result) {
        var listItem = document.createElement('LI');
        var listItemText = document.createTextNode(result.title);
        listItem.appendChild(listItemText); 
        searchResultList.appendChild(listItem);
    });
    
}

saatchiMusic.auth();