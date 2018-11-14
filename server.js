//Mango set up
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;
var client = new MongoClient("mongodb://localhost:27017", { useNewUrlParser: true });
var db;

//Express setup
var express = require("express");
var app = express();
var http = require("http");
var server = http.Server(app);
//SocketIO setup
var socketio = require("socket.io");
var io = socketio(server);
//Global vars
var loginInfo;
var playerData=[];
var games=[];
var shopItems=[{		// 1st elem are the actual items. numbers are pts required to buy..
	'item1': 2,
	'item2': 2,
	'item3': 3,
	'item4': 2,
	'item5': 2,
	'item6': 3,
	'item7': 5
}];

app.use(express.static("pub"));
function getOpposite(piece){
	if(piece){
		
	}
}
function buildTable(shopItems){
	var table = document.createElement('table');
	var thead = document.createElement('thead');
	var tbody = document.createElement('tbody');

	var theadTr = document.createElement('tr');
	for(var i = 0; i < shopItems.length; i++) {
		var theadTh = document.createElement('th');
		theadTh.innerHTML = shopitems[i];
		
	}
}

function winCheck(gameBoard,piece){
	let n=gameBoard.length;
	for(i=0;i<n;i++){
		if(gameBoard[i][0]===piece){
			let win=true;
			for(j=0;j<n;j++){
				win=win&&(gameboard[i][j]===piece);
			}
			if(win){
				return true;
			}
		}
	}
	for(i=0;i<n;i++){
		if(gameBoard[0][i]===piece){
			let win=true;
			for(j=0;j<n;j++){
				win=win&&(gameboard[j][i]===piece);
			}
			if(win){
				return true;
			}
		}
	}
	if(gameBoard[0][0]===piece){
		let win=true;
		for(i=0;i<n;i++){
			win=win&&(gameboard[i][i]===piece);
		}
		if(win){
			return true;
		}
	}
	if(gameBoard[0][n]===piece){
		let win=true;
		for(i=0;i<n;i++){
			win=win&&(gameboard[i][n-(1+i)]===piece);
		}
		if(win){
			return true;
		}
	}
	return false;
}
function fullBoardCheck(gameBoard){
	let full=true;
	for(i=0;i<gameBoard.length;i++){
		if(gameBoard[i].indexOf("blank")==-1){
			full=false;
		}
	}
	return full;
}
function joinMainLobby(socket,userName){
	playerData[socket.id]={name:userName,room:'lobby',team:''};
	socket.leaveAll();
	socket.join('lobby');
}
function getGamesHtml(){
	console.log(games);
	var ret="<table>";
	for(var game in games){
		ret+="<tr><th>"+games[game].name+"</th></tr>"
	}
	ret+="</table>";
	return ret;
}
function getPlayersHtml(room){
	var clients = io.sockets.adapter.rooms[room].sockets;  
	var ret="<table>";
	for(var clientId in clients ){
		ret+="<tr><th>"+playerData[clientId].name+"</th></tr>";
	}
	ret+="</table>";
	return ret;
}
function getNumPlayers(room){
	var clients = io.sockets.adapter.rooms[room].sockets;  
	let ret=0;
	for(var clientId in clients ){
		ret++;
	}
	return ret;
}
function getGameBoardHtml(gameBoard){
	var ret="<table>";
	for(i=0;i<gameBoard.length;i++){
		ret+="<tr>";
		for(j=0;j<gameBoard.length;j++){
			ret+="<td> <img src="+gameBoard[i][j]+".png class=\"gameTile\"></td>";
		}
		ret+="</tr>";
	}
	ret+="</table>"
	return ret;
}
function createGameBoard(n){
	var gameBoard=[];
	var row=[];
	for(i=0;i<n;i++){
		row.push("blank");
	}
	for(i=0;i<n;i++){
		gameBoard.push(row);
	}
	return gameBoard;
}
io.on("connection", function(socket) {
	console.log("Somebody connected.");
	socket.join('preLobby');
	socket.on("disconnect", function() {
		console.log("Somebody disconnected.");
		socket.leaveAll();
		delete playerData[socket.id];
	});
	socket.on("login", function(dataFromClient,successFunction) {
		loginInfo.find({userName:dataFromClient.userName}).toArray(function(err, result) {
			if(result.length>0&&result[0].password===dataFromClient.password){
				joinMainLobby(socket,dataFromClient.userName);
				successFunction(true);
			}else{
				console.log("login failed");
				successFunction(false);
			}
		});
	});
	socket.on("newUser", function(dataFromClient,successFunction) {
		loginInfo.find({userName:dataFromClient.userName}).toArray(function(err, result) {
			if(result.length==0){
				loginInfo.insertOne({userName:dataFromClient.userName,password:dataFromClient.password});
				joinMainLobby(socket,dataFromClient.userName);
				successFunction(true);
			}else{
				console.log("name exists");
				successFunction(false);
			}
		});
	});
	socket.on("newGame", function(boardSize){
		socket.leaveAll();
		let firstTeam='x';
		if(Math.random>.5){
			firstTeam='o';
		}
		games[playerData[socket.id].name]={name:playerData[socket.id].name,gameBoardSize:boardSize,gameBoard:createGameBoard(boardSize),turn:firstTeam};
		let roomString=playerData[socket.id].name;
		console.log(roomString);
		playerData[socket.id].room=roomString;
		socket.join(roomString);
		io.to('lobby').emit("updateGames",getGamesHtml());
		io.to(roomString).emit("updatePlayers",getPlayersHtml(roomString));
		io.to(roomString).emit("updateGameBoard",getGameBoardHtml(games[roomString].gameBoard));
		playerData[socket.id].team='o';
	});
	socket.on("getGames",function(setHtml){
		setHtml(getGamesHtml());
	});
	socket.on("joinedLobby",function(){
		io.to('lobby').emit("updateGames",getGamesHtml());
	});
	socket.on("shopMenu",function(){
		
	});
	socket.on("joinGame",function(gameName,successFunction){
		console.log(io.sockets.adapter.rooms[gameName].sockets.length);
		if(getNumPlayers(gameName)<2){
			socket.leaveAll();
			socket.join(gameName);
			playerData[socket.id].room=gameName;
			io.to(gameName).emit("updatePlayers",getPlayersHtml(gameName));
			io.to(gameName).emit("updateGameBoard",getGameBoardHtml(games[gameName].gameBoard));
			playerData[socket.id].team='x';
			successFunction(true);
		}
		else{
			successFunction(false);
		}
	});
	socket.on("leaveGame",function(){
		let room=playerData[socket.id].room;
		if(getNumPlayers(room)===1){
			delete games[room];
			socket.leaveAll();
			socket.join('lobby');
		}
		else{
			socket.leaveAll();
			socket.join('lobby');
			io.to(room).emit("updatePlayers",getPlayersHtml(room));
			playerData[socket.id].room='lobby';
		}
		io.to('lobby').emit("updateGames",getGamesHtml());
	});
	socket.on("getPlayers",function(setHtml){
		setHtml(getPlayersHtml(playerData[socket.id].room));
	});
	socket.on("placePiece",function(x,y,errorFunction){
		console.log("Placing piece at "+x+":"+y);
		if(games[playerData[socket.id].room].turn===playerData[socket.id].team){
			if(gameBoard[x][y]==="blank"){
				
			}
			else{
				errorFunction("This square is already occupied");
			}
		}
		else{
			errorFunction("It is not your turn");
		}
	});
});
client.connect(function(err) {
	if (err != null) throw err;
	else {
		db = client.db("TicTacIO");
		loginInfo=db.collection("loginInfo");
		server.listen(80, function() {
			console.log("Server with socket.io is ready.");
		});
	}
});

