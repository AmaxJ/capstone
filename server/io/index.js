'use strict';
var socketio = require('socket.io');
var io = null;
var Song = require('mongoose').model('Song');
var Room = require('mongoose').model('Room');
var SongData = require('mongoose').model('SongData');
var PowerupData = require('mongoose').model('PowerupData');

module.exports = function(server) {

    if (io) return io;

    io = socketio(server);

    io.on('connection', function(socket) {
        //TODO when a user joins a CREATE A USERSCORE OBJ!
        // Now have access to socket, wowzers!
        console.log('Someone connected!!!');
        //Vote functions
        socket.on('vote', function(payload) {
            var song = payload.song;
            var user = payload.user;
            var vote = payload.vote;
            var room = payload.room;
            var savedSongData;
            var playlist = payload.room.playlist;
            SongData.findOne({
                    _id: song._id
                })
                .then(function(songData) {
                    return songData.vote(user._id, vote)
                })
                .then(function(songData) {
                    return SongData.findById(songData._id)
                        .populate('song')

                })
                .then(function(songDataObj) {
                    savedSongData = songDataObj;
                    return Room.findById(room._id)
                })
                .then(function(room) {
                    var amount = vote === 'up' ? 1 : -1;
                    return room.addToScore(savedSongData, amount);
                })
                .then(room => {
                    console.log("SAVEDSONGDATA", savedSongData);
                    io.emit('updateVotes', {
                        updatedSong: savedSongData,
                        updatedRoom: room
                    });
                })
                .then(null, function(err) {
                    console.log('Something went wrong with songData', err);
                })

        })
        //User leaves room
        socket.on('userLeft', function(data) {
            let roomId = data.roomId;
            let userId = data.userId;

            Room.findById(roomId)
                .then((room) => {
                    return room.removeUser(userId);
                })
                .then((room) => {
                    io.emit('updateUsers', room);
                })
        })
        //User enters room
        socket.on('userEntered', function(data) {
            let roomId = data.roomId;
            let userId = data.userId;

            Room.findById(roomId)
                .then((room) => {
                    return room.addUser(userId);
                })
                .then((room) => {
                    io.emit('updateUsers', room);
                })
        })
        //Add a powerup
        socket.on('addPowerUp', function(payload){
            var playlist = payload.playlist;
            var userId = payload.user;

            Room.findOne({playlist: playlist})
            .then(function(room){
                return PowerupData.findOne({room: room._id, user: userId})
            })
            .then(function(powerupData){
                console.log('POWER UP DATA?', powerupData)
                return powerupData.addPowerup();
            })
            .then((updatedPowerups)=> {
                io.emit('updatePowerups', updatedPowerups)
            })
        })
        //Use a powerup
        socket.on('usePowerUp', function(payload){
            var powerup = payload.powerup;
            var user = payload.user;
            var room = payload.room;
            PowerupData.findOne({room: room._id, user: user._id})
            .then((powerupData)=> {
                return powerupData.usePowerup(powerup);
            })
            .then((updatedPowerups)=> {
                io.emit('updatePowerups', updatedPowerups)
            })
        })
    });

    return io;

};
