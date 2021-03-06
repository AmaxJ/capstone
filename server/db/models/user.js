'use strict';
var crypto = require('crypto');
var mongoose = require('mongoose');
var _ = require('lodash');
var rp = require('request-promise');
var PowerupData = mongoose.model('PowerupData');

var schema = new mongoose.Schema({
    username: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    location: {
        type: String
    },
    coordinates: {
        type: [Number]
    },
    normalizedLocation: {
        type: String
    },
    DOB: {
        type: String
    },
    age: {
        type: Number
    },
    salt: {
        type: String
    },
    dateCreation: {
        type: Date,
        default: Date.now
    },
    twitter: {
        id: String,
        username: String,
        token: String,
        tokenSecret: String
    },
    facebook: {
        id: String
    },
    google: {
        id: String
    },
    experience: {
        type: Number
    },
    rank: {
        type: Number
    },
    picture: {
        type: String
    },
    powerups: [{
        type: [String],
        enum: ['Chopsticks of Plenty', 'Sword of Ultimate Shame', 'Daggers of Disdain', 'Katana of Disgrace', 'Enlightened Blessing', 'Sword of Uncertainty', 'Poison Darts', 'The Last Jamurai']
    }]
});

// method to remove sensitive information from user objects before sending them out
schema.methods.sanitize =  function () {
    return _.omit(this.toJSON(), ['password', 'salt']);
};

//adds a powerup to user 
schema.statics.savePowerup = (powerup, user) => {
    user.powerups.addToSet(powerup);
    return user.save()
}

// generateSalt, encryptPassword and the pre 'save' and 'correctPassword' operations
// are all used for local authentication security.
var generateSalt = function () {
    return crypto.randomBytes(16).toString('base64');
};

var encryptPassword = function (plainText, salt) {
    var hash = crypto.createHash('sha1');
    hash.update(plainText);
    hash.update(salt);
    return hash.digest('hex');
};

var getCoords = function(locString) {
    var url = 'https://maps.googleapis.com/maps/api/geocode/json?address='+locString+'&key=AIzaSyBOwi-4AsRFS8G0SYIAv5ysZpGU-LnOpgY';
    return rp(url)
    .then(function(htmlString) {
        var objHtml = JSON.parse(htmlString);
        var sumNELat = 0;
        var sumNELong = 0;
        var sumSWLat = 0;
        var sumSWLong = 0;
        if(objHtml.results.length>0)
        {
            for(var x=0; x<objHtml.results.length; x++)
            {
                sumNELat+= objHtml.results[x].geometry.bounds.northeast.lat;
                sumNELong+= objHtml.results[x].geometry.bounds.northeast.lng;
                sumSWLat += objHtml.results[x].geometry.bounds.southwest.lat;
                sumSWLong += objHtml.results[x].geometry.bounds.southwest.lng;
            }
            var avgNELat = sumNELat/objHtml.results.length;
            var avgNELong = sumNELong/objHtml.results.length;
            var avgSWLat = sumSWLat/objHtml.results.length;
            var avgSWLong = sumSWLong/objHtml.results.length;
            var lat = (avgNELat+avgSWLat)/2;
            var lng = (avgNELong+avgSWLong)/2;
            return [lat,lng];
        }
        else
        {
            return;
        }
    })
}

var getNormLoc = function(coords) {
    var url = 'https://maps.googleapis.com/maps/api/geocode/json?latlng='+coords[0]+','+coords[1]+'&key=AIzaSyBOwi-4AsRFS8G0SYIAv5ysZpGU-LnOpgY';
    return rp(url)
    .then(function(results) {
        var objRes = JSON.parse(results);
        if(objRes.results.length > 0)
        {
            for(var y=0; y<objRes.results[0].address_components.length; y++)
            {
                var typeArr = objRes.results[0].address_components[y].types;
                var sublocality = typeArr.indexOf('sublocality_level_1');
                var locality = typeArr.indexOf('locality');
                var adminArea = typeArr.indexOf('administrative_area_level_1');

                if(sublocality >= 0 || locality >= 0)
                {
                    var city = objRes.results[0].address_components[y].long_name;
                }

                else if(adminArea >= 0)
                {
                    var state = objRes.results[0].address_components[y].short_name;
                }
            }
            var normalizedLocationString = city+', '+state;
            return normalizedLocationString;
        }
        else
        {
            return;
        }
        
    })
}

var getAge = function(DOB) {
    var bday = Date.parse(DOB);
    var today = new Date();
    var todayYear = today.getYear();
    var todayMonth = today.getMonth().toString();
    var todayDate = today.getDate().toString();
    var todayMonthDate = Number(todayMonth.concat(todayDate))
    if(bday)
    {
        var bdayDate = new Date(bday);
        var bdayMonth = bdayDate.getMonth().toString();
        var bdayDay = bdayDate.getDate().toString();
        var bdayYear = bdayDate.getYear();
        var bdayMonthDate = Number(bdayMonth.concat(bdayDay));
        var age = todayYear - bdayYear;
        if(bdayMonthDate > todayMonthDate)
        {
            age--;
        }
    }
    return age;
}


schema.pre('save', function (next) {

    var doc = this;

    if (doc.isModified('password')) 
    {
        doc.salt = doc.constructor.generateSalt();
        doc.password = doc.constructor.encryptPassword(doc.password, doc.salt);
    }
    if(doc.DOB)
    {
        doc.age = getAge(doc.DOB)
    }
    if(doc.location)
    {
        return getCoords(doc.location)
        .then(function(coordinates){
            doc.coordinates = coordinates;
            if(coordinates)
            {
                return getNormLoc(doc.coordinates);
            }
            else
            {
                next();
            }
        })
        .then(function(normLoc){
            doc.normalizedLocation = normLoc;
            next();
        })
        .then(null,next)
    }
    else if(doc.coordinates)
    {
        return getNormLoc(doc.coordinates)
        .then(function(normLoc){
            doc.normalizedLocation = normLoc;
            next()
        })
        .then(null,next)
    }

    next();
    

});



schema.statics.generateSalt = generateSalt;
schema.statics.encryptPassword = encryptPassword;

schema.method('correctPassword', function (candidatePassword) {
    return encryptPassword(candidatePassword, this.salt) === this.password;
});

mongoose.model('User', schema);