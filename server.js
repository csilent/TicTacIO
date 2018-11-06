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
app.use(express.static("pub"));

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
		games[playerData[socket.id].name]={name:playerData[socket.id].name,gameBoardSize:boardSize,gameBoard:createGameBoard(boardSize)};
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

