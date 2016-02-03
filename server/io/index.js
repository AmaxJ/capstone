'use strict';
var socketio = require('socket.io');
var io = null;
var Song = require('mongoose').model('Song');
var SongData = require('mongoose').model('SongData');

module.exports = function (server) {

    if (io) return io;

    io = socketio(server);

    io.on('connection', function (socket) {
        // Now have access to socket, wowzers!
        console.log('Someone connected!!!');
        socket.on('vote', function(payload){
            console.log('Hitting this socket')
            var song = payload.song;
            var user = payload.user;
            var vote = payload.vote;
            var room = payload.room;
            var playlist = payload.room.playlist;
            console.log('PAYLOAD',payload)
            SongData.findOne({_id: song._id})
            .then(function(songData){
                console.log('SONG DATA OBJ', songData)
                return songData.vote(user._id, vote)
            })
            .then(function(songData){
                console.log('Update song data', songData);
                return SongData.findById(songData._id)
                    .populate('song')
            })
            .then(songData => {
        	   io.emit('updateVotes', songData);
            })
            .then(null, function(err){
                console.log('Something went wrong with songData', err);
            })

        })
    });
    
    return io;

};
