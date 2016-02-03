'use strict';
var mongoose = require('mongoose');

var schema = new mongoose.Schema({

    playlist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Playlist"
    },

    song: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song"
    },

    upVotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    downVotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    total : {
        type: Number,
        default: 0
    }

});

schema.method({
    calculateValue : function() {
        this.total = this.upVotes.length - this.downVotes.length;
        return this.save();
    },
    vote : function(userId, vote) { //vote = 'up' or 'down'
        if (!userId || !vote) return;
        if (this.upVotes.indexOf(userId) > -1) return;
        if (this.downVotes.indexOf(userId) > -1) return;
        if (vote === 'up') {
            this.upvotes.push(userId);
        } else if (vote === 'down') {
            this.downVotes.push(userId);
        }
        return this.save();
    },
    removeVote: function(userId, vote) {
        if (!userId) return;
        if (vote) {
            var voteProp = vote + "Votes";
            var userIndex = this[voteProp].indexOf(userId);
            this[voteProp].splice(userIndex, 1);
        }
        return this.save();
    }
});

mongoose.model('SongData', schema);