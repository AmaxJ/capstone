'use strict'
var mongoose = require('mongoose');
var SongData = mongoose.model('SongData');

var schema = new mongoose.Schema({
    songs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "SongData"
    }],
    songStorage: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "SongData"
    }]
});

schema.method({
    addSong: function(songId, userId) {
        var self = this;
        SongData.create({
            playlist: self._id,
            song: songId,
            submittedBy : userId
        })
        .then(songDataObj => {
            self.songs.addToSet(songDataObj._id);
            self.songStorage.addToSet(songDataObj._id);
            return self.save();
        })
        .then(null, console.error.bind(console));
    },
    updateSongValue : function(songId, total) {
        return SongData.findOne({song: songId})
            .then(function(songDataObj) {
                songDataObj.total = total;
                return songDataObj.save();
            });
    },
    removeSong: function(songId) {
        var indexToRemove = this.songs.indexOf(songId);
        this.songs.splice(indexToRemove, 1);
        return this.save();
    }
});


mongoose.model('Playlist', schema);
