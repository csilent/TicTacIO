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
var userNames=[];


/**
* Player object. Can store individual game details. Insert these into DB?? 
*/
var Player = function(name, id) {   // Name of client and client id (ObjectID? socketID?)
    this.name = name;
    this.id = id;
    this.currentTurn = true;    // Bool value to determine if it is this players move.
    this.totalMoves = 0;        // Keep track of total moves by player
    this.totalWins = 0;
}

Player.prototype.getTotalMoves = function() {  // Getter for players total moves
    return this.totalMoves;
}
Player.prototype.getTotalWins = function() {
    return this.totalMoves;
}

Player.prototype.setCurrentTurn = function(turn) {  // Setter. Make this Player's currentTurn = 'turn'
    this.currentTurn = turn;
    if(turn) {
        // $('#...').text("It is Your turn");   // **need html DOM element.. update client GUI that it is their turn
    }
    else{
        // $(#"...").text("Opponents turn");   // **need html DOM element.. update client GUI that he is waiting.
    }
}

Player.prototype.getName = function() {
    return this.name;
}


app.use(express.static("pub"));
function joinMainLobby(socket,userName){
	userNames[socket.id]=userName;
	socket.leave('prelobby');
	socket.join('lobby');
}
io.on("connection", function(socket) {
	console.log("Somebody connected.");
	socket.join('preLobby');
	socket.on("disconnect", function() {
		console.log("Somebody disconnected.");
		socket.leaveAll();
		delete userNames[socket.id];
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

