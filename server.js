//Mango set up
//this is a test
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
	var ret="";
	for(let i=0;i<games.length;i++){
		ret+="<tr><th>"+games[i].name+"</th></tr>"
	}
	return ret;
}
io.on("connection", function(socket) {
	console.log("Somebody connected.");
	socket.join('preLobby');
	socket.on("disconnect", function() {
		console.log("Somebody disconnected.");
		socket.leaveAll();
		delete playerData[socket.id];
	});
	socket.on("login", function(dataFromClient,errorFunction) {
		loginInfo.find({userName:dataFromClient.userName}).toArray(function(err, result) {
			if(result.length>0&&result[0].password===dataFromClient.password){
				joinMainLobby(socket,dataFromClient.userName);
				errorFunction(true);
			}else{
				console.log("login failed");
				errorFunction(false);
			}
		});
	});
	socket.on("newUser", function(dataFromClient,errorFunction) {
		loginInfo.find({userName:dataFromClient.userName}).toArray(function(err, result) {
			if(result.length==0){
				loginInfo.insertOne({userName:dataFromClient.userName,password:dataFromClient.password});
				joinMainLobby(socket,dataFromClient.userName);
				errorFunction(true);
			}else{
				console.log("name exists");
				errorFunction(false);
			}
		});
	});
	socket.on("newGame", function(){
		socket.leave('lobby');
		games.push({name:playerData[socket.id].name});
		socket.join(playerData[socket.id].name);
		playerData[socket.id].room=playerData[socket.id].name;
		io.to('lobby').emit("updateGames",getGamesHtml());

	});
	socket.on("getGames",function(setHtml){
		setHtml(getGamesHtml());
	});
	socket.on("joinedLobby",function(){
		io.to('lobby').emit("updateGames",getGamesHtml());
	});
	socket.on("joinGame",function(lobbyIndex){
		socket.leave('lobby');
		socket.join(games[lobbyIndex].name);
		playerData[socket.id].room=games[lobbyIndex].name;
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

