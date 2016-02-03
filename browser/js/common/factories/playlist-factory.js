app.factory('PlaylistFactory', function($http, $rootScope, SocketFactory) {
    var factory = {};
    var playlist;
    var socket = SocketFactory.getSocket();

    //Called when new room is created
    factory.createPlaylist = function() {
        return $http.post('/api/playlists', {})
            .then(function(response) {
                playlist = response.data;
                return response.data._id;
            });
    };

    //Returns the playlist for specific room
    factory.getRoomPlaylist = () => {
        return $http({
            method: 'GET',
            url: '/api/playlists/' + playlist._id
        })
        .then(response => {
            playlist =response.data
        });
    }

    //Returns song from DB or null if song doesn't exist
    var _findSongAndReturn = function(song) {
        var youtubeId = song.id.videoId;
        return $http.get('/api/songs/yid/' + youtubeId)
            .then(function(song) {
                return song.data;
            });
    };

    //Creates new song in database
    var _addSongToDb = function(song) {
        var newSong = {
            title: song.snippet.title,
            youTubeId: song.id.videoId,
            youTubeChannel: song.snippet.channelTitle,
            publishedAt: song.snippet.publishedAt,
            thumbnails: song.snippet.thumbnails
        }
        return $http.post('/api/songs', newSong)
            .then(function(response) {
                return response.data;
            });
    };

    //Adding new songs to room playlist
    factory.addSong = function(song) {
        return _findSongAndReturn(song)
            .then(function(songFromDb) {
                if (!songFromDb) {
                    return _addSongToDb(song);
                }
                return songFromDb;
            })
            .then(function(song) {
                return $http.put('/api/playlists/' + playlist._id, {
                    song: song
                });
            })
            .then(null, console.error.bind(console));
    };

    //TODO: Check to make sure this works
    //Sorts playlist by vote value
    factory.sort = function() {
        playlist.songs.sort(function(a, b) {
            return b.total - a.total;
        });
    };

    factory.vote = function($event, song, vote, user, room) {
        SocketFactory.emitVote({song: song, vote: vote, user: user, room: room});
    };

    factory.setPlaylist = function(newPlaylist) {
        playlist = newPlaylist;
    };

    factory.getPlaylist = function() {
        return playlist;
    };


    socket.on('updateVotes', function(songObj) {
        var songToUpdate = _.find(playlist.songs, function(o) {
                return o.song.title === songObj.song.title;
            })
        var updateIndex = playlist.songs.indexOf(songToUpdate)
        playlist.songs[updateIndex] = songObj;
        factory.sort();
        $rootScope.$digest();
    })

    return factory;
})
