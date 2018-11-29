var socket = io();
socket.on("fullGameBoard", function() {
	$("#boardError").html("The board has been filled up, it is a draw");

});
socket.on("gameWon", function(winningTeam) {
	let wonMessage="<b>Team "+winningTeam+" has won the game</b>";
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
socket.on("updateSpecialMoves",function(removeMoves,doubleMoves){
	$("#xmoves").html(removeMoves);
	$("#omoves").html(doubleMoves);
});
socket.on("updatePlayers",function(players){
	$("#players").html(players);
});
socket.on("updateGameBoard",function(gameBoard){
	$("#gameBoard").html(gameBoard);
	$("#gameBoard td").click(function() {
		let x=$(this).parent().index();
		let y=$(this).index();
		socket.emit("getMoveType",function(moveType){
			socket.emit(moveType,x,y,function(errorMsg){
				$("#boardError").html(errorMsg);
			});
		});
	});
});
socket.on("sayAll", function(dataFromServer) {
	$("#chatWindow").append(dataFromServer+"\n");
	$("#chatWindow").scrollTop($("#chatWindow")[0].scrollHeight)
});
socket.on("updateShop",function(shophtml){
	$("#shopTable").html(shophtml);
	$("#xtable td").click(function(){   //selection testing
		console.log(this.id);
		$(this).addClass('selected').siblings().removeClass('selected');
		socket.emit("purchaseTiles", parseInt(this.id));  
	 });
	 $("#otable td").click(function(){   //selection testing
		console.log(this.id);
		$(this).addClass('selected').siblings().removeClass('selected');
		socket.emit("purchaseTiles", parseInt(this.id)+9.0);  
	 });
	 $("#pxtable td").click(function() {
		$(this).addClass('selected').siblings().removeClass('selected');
		socket.emit("changeCurrentXtile", this.id);
		console.log("pxtable id: "+this.id);
	 });
	 $("#potable td").click(function() {
		$(this).addClass('selected').siblings().removeClass('selected');
		socket.emit("changeCurrentOtile", this.id);
		console.log("potable id: "+this.id);
	 });
});
socket.on("updatePurchasedXtable", function(purchasedTiles) {
	$("#purchasedXItems").html(purchasedTiles);
});
socket.on("updatePurchasedOtable", function(purchasedTiles) {
	$("#purchasedOItems").html(purchasedTiles);
});

socket.on("updateItemSelection",function(){	// for Selection
	$("#shopTable").selectable();
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
				$("#chat").show();
				socket.emit("joinedLobby");
			}
		});
	});
	$("#shopButton").click(function(){	// Displays xShopItems by default.
		socket.emit("shopMenu");
		$("#lobby").hide();
		$("#shop").show();
		$("#purchasedOItems").hide();
		$("#purchasedXItems").show();
		$(function() {
			//$("#shopTable").selectable();
		});
	});
	$("#leaveShopButton").click(function(){
		socket.emit("leaveShop");
		$("#lobby").show();
		$("#shop").hide();
	});
	$("#xShopButton").click(function(){	// Display xShopItems. 'Refactor'
		socket.emit("shopMenu");
		$("#purchasedOItems").hide();
		$("#purchasedXItems").show();
		$("#lobby").hide();
		$("#shop").show();
	});
	$("#oShopButton").click(function(){	// Display oShopItems. 'Refactor'
		socket.emit("oshopMenu");
		$("#purchasedXItems").hide();
		$("#purchasedOItems").show();
		$("#lobby").hide();
		$("#shop").show();
	});

	$("#newGameButton").click(function(){
		socket.emit("newGame",$("#gameBoardSize").val(),$("#gameRemoveMoves").val(),$("#gameDoubleMoves").val());
		$("#lobby").hide();
		$("#game").show();
		$("#boardError").html("");
	});
	$("#leaveGameButton").click(function(){
		$("#lobby").show();
		$("#game").hide();
		socket.emit("leaveGame");
	});
	$("#doubleMoveButton").click(function(){
		socket.emit("changeMoveType","doubleMove");
	});	
	$("#removeMoveButton").click(function(){
		socket.emit("changeMoveType","removeMove");
	});	
	$("#normalMoveButton").click(function(){
		socket.emit("changeMoveType","placePiece");
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