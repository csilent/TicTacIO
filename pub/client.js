var socket = io();

socket.on("updateGames", function(games) {
	console.log(games);
	$("#games").html(games);
	$("#games tr").click(function() {
		socket.emit("joinGame",$(this).text(),function(success){
			if(success){
				$("#gameError").html("");
				$("#lobby").hide();
				$("#game").show();
			}
			else{
				$("#gameError").html("Lobby is full");
			}
		});
	});
});
socket.on("updatePlayers",function(players){
	console.log(players);
	$("#players").html(players);
});
socket.on("updateGameBoard",function(gameBoard){
	console.log(gameBoard);
	$("#gameBoard").html(gameBoard);
});

function startItAll() {
	$("#lobby").hide();
	$("#game").hide();
	$("#loginButton").click(function() {
		socket.emit("login", {userName:$("#userText").val(),password:$("#passwordText").val()},function(success){
			if(!success){
				$("#error").html("Username/password does not match");
			}
			else{
				$("#error").html("");
				$("#login").hide();
				$("#lobby").show();
				socket.emit("joinedLobby");
			}
		});
	});
	$("#newUserButton").click(function() {
		socket.emit("newUser", {userName:$("#userText").val(),password:$("#passwordText").val()},function(success){
			if(!success){
				$("#error").html("username already taken");
			}
			else{
				$("#error").html("");
				$("#login").hide();
				$("#lobby").show();
				socket.emit("joinedLobby");
			}
		});
	});
	$("#newGameButton").click(function(){
		socket.emit("newGame");
		$("#lobby").hide();
		$("#game").show();
	});
	$("#leaveGameButton").click(function(){
		$("#lobby").show();
		$("#game").hide();
		socket.emit("leaveGame");
	});
}
$(startItAll);