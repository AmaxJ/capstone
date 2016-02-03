app.config( $stateProvider => {
	$stateProvider.state('room', {
		url: '/room/:roomId',
		templateUrl: '/js/room/room-template.html',
		controller: 'RoomCtrl',
		resolve: {
			room(RoomFactory, $stateParams) {
				return RoomFactory.getRoomById( $stateParams.roomId )
						.then(room => room);
			},
			user(AuthService) {
				return AuthService.getLoggedInUser()
						.then(user => user);
			}
		},
		onExit: function (user, room, RoomFactory) {
			RoomFactory.removeUserEmit(room._id, user._id);
		}
	})
})
.controller('RoomCtrl', ($scope, room, user, RoomFactory, SocketFactory) => {

		var socket = SocketFactory.getSocket();
		
		socket.on('updateUsers', function(room) {
		        console.log('its happening in the controller', room)
		        $scope.room = room;
		        $scope.$digest();
		    })

		$scope.room = room;
		$scope.user = user;

		// $scope.getUsers = () => {
		// 	console.log('running', users);
		// 	return users;
		// }

		RoomFactory.addUserEmit(room._id, user._id);

		// RoomFactory.addUserToRoom(user._id, room._id)
		// .then(() => {
		// 	RoomFactory.addOrRemoveUser();
		// })

});
