var socket = io();
socket.on("fullGameBoard", function() {
	$("#boardError").html("The board has been filled up, it is a draw");

});
socket.on("gameWon", function(winningTeam) {
	let wonMessage="Team "+winningTeam+" has won the game";
	$("#boardError").html(wonMessage);
});
socket.on("updateGames", function(games) {
	$("#games").html(games);
	$("#games tr").click(function() {
		socket.emit("joinGame",$(this).text(),function(success){
			if(success){
				$("#gameError").html("");
				$("#lobby").hide();
				$("#game").show();
				$("#boardError").html("");
			}
			else{
				$("#gameError").html("Lobby is full");
			}
		});
	});
});
socket.on("updatePlayers",function(players){
	$("#players").html(players);
});
socket.on("updateGameBoard",function(gameBoard){
	$("#gameBoard").html(gameBoard);
	$("#gameBoard td").click(function() {
		socket.emit("placePiece",$(this).parent().index(),$(this).index(),function(errorMsg){
			$("#boardError").html(errorMsg);
		});
	});
});
socket.on("sayAll", function(dataFromServer) {
	$("#chatWindow").append(dataFromServer+"\n");
	$("#chatWindow").scrollTop($("#chatWindow")[0].scrollHeight)
});
socket.on("updateShop",function(shophtml){
	$("#shopTable").html(shophtml);
});


function startItAll() {
	$("#lobby").hide();
	$("#game").hide();
	$("#shop").hide();
	$("#chat").hide();
	$("#loginButton").click(function() {
		socket.emit("login", {userName:$("#userText").val(),password:$("#passwordText").val()},function(success){
			if(!success){
				$("#error").html("Username/password does not match");
			}
			else{
				$("#error").html("");
				$("#login").hide();
				$("#lobby").show();
				$("#chat").show();
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
	$("#shopButton").click(function(){
		socket.emit("shopMenu");
		$("#lobby").hide();
		$("#shop").show();
	});
	$("#leaveShopButton").click(function(){
		socket.emit("leaveShop");
		$("#lobby").show();
		$("#shop").hide();
	});
	$("#newGameButton").click(function(){
		socket.emit("newGame",$("#gameBoardSize").val());
		$("#lobby").hide();
		$("#game").show();
		$("#boardError").html("");
	});
	$("#leaveGameButton").click(function(){
		$("#lobby").show();
		$("#game").hide();
		socket.emit("leaveGame");
	});
	$("#chatButton").click(function() {
		socket.emit("sendChat", $("#message").val());
		$("#message").val("");
	});
	$("#message").keydown(function(event) {
		if (event.which == 13) {
			socket.emit("sendChat", $("#message").val());
			$("#message").val("");
		}
	});
	$("#chatWindow").keypress(function(event) {
		event.preventDefault();
	});
	$("#chatWindow").keydown(function(event) {
		event.preventDefault();
	});

}
$(startItAll);