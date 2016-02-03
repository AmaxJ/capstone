app.factory('SocketFactory', function() {
        if (!window.io) throw new Error('socket.io not found!');
        // return window.io(window.location.origin);
        var socket = io.connect(window.location.href);

        var factory = {};

        factory.emitVote = function(song){
        	socket.emit('vote', song);
        }

        factory.emitUserAdd = function (roomId, userId) {
            socket.emit('userEntered', {roomId: roomId, userId: userId});
        }

        factory.emitUserRemove = function (roomId, userId) {
            socket.emit('userLeft', {roomId: roomId, userId: userId})
        }

        factory.getSocket = function(){
        	return socket;
        }


        return factory;
    });