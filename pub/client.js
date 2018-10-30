var socket = io();

socket.on("updateGames", function(games) {
	console.log(games);
	$("#games").html(games);
	$("#games tr").click(function() {
		$("#lobby").hide();
		$("#game").show();
		socket.emit("joinGame",$(this).index());
	});
});

function startItAll() {
	$("#lobby").hide();
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
}
$(startItAll);