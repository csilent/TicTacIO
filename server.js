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
	playerData[socket.id]={name:userName,room:'lobby'};
	socket.leave('prelobby');
	socket.join('lobby');
}
function getGamesHtml(){
	var ret="<table>";
	for(let i=0;i<games.length;i++){
		ret+="<tr><th>"+games[i].name+"</th></tr>"
	}
	ret+="</table>";
	return ret;
}
function getPlayersHtml(room){
	var clients = io.sockets.adapter.rooms[room].sockets;  
	var ret="<table>";
	for(var clientId in clients ){
		ret+="<tr><th>"+playerData[clientId].name+"</th></tr>"
	}
	ret+="</table>";
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
	socket.on("newGame", function(){
		socket.leave('lobby');
		games.push({name:playerData[socket.id].name,gameBoard:createGameBoard(3)});
		console.log(games[games.length-1].gameBoard);
		playerData[socket.id].room=games.length-1;
		socket.join(playerData[socket.id].room);
		io.to('lobby').emit("updateGames",getGamesHtml());
		io.to(playerData[socket.id].room).emit("updatePlayers",getPlayersHtml(playerData[socket.id].room));
		io.to(playerData[socket.id].room).emit("updateGameBoard",getGameBoardHtml(games[playerData[socket.id].room].gameBoard));
	});
	socket.on("getGames",function(setHtml){
		setHtml(getGamesHtml());
	});
	socket.on("joinedLobby",function(){
		io.to('lobby').emit("updateGames",getGamesHtml());
	});
	socket.on("joinGame",function(gameIndex){
		socket.leave('lobby');
		socket.join(gameIndex);
		playerData[socket.id].room=gameIndex;
		io.to(playerData[socket.id].room).emit("updatePlayers",getPlayersHtml(playerData[socket.id].room));
		io.to(playerData[socket.id].room).emit("updateGameBoard",getGameBoardHtml(games[playerData[socket.id].room].gameBoard));
	});
	socket.on("leaveGame",function(){
		socket.leaveAll();
		socket.join('lobby');
		let room=playerData[socket.id].room;
		io.to(room).emit("updatePlayers",getPlayersHtml(room));
		if(io.sockets.adapter.rooms[room].sockets.length===0){
			games.splice(room,1);
		}
		playerData[socket.id].room='lobby';
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

