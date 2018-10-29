var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;
var client = new MongoClient("mongodb://localhost:27017", { useNewUrlParser: true });
var db;

var express = require("express");

var app = express();

var http = require("http");

var server = http.Server(app);

var socketio = require("socket.io");

var io = socketio(server);

app.use(express.static("pub"));

//Every time a client connects (visits the page) this function(socket) {...} gets executed.
//The socket is a different object each time a new client connects.
io.on("connection", function(socket) {
	console.log("Somebody connected.");

	socket.on("disconnect", function() {
		//This particular socket connection was terminated (probably the client went to a different page
		//or closed their browser).
		console.log("Somebody disconnected.");
	});

	socket.on("sayHello", function(dataFromClient) {
		console.log(dataFromClient);
		var s = new Date();
		socket.emit("sayAll", dataFromClient + " ; " + s.toTimeString());
	});

});


server.listen(80, function() {
	console.log("Server with socket.io is ready.");
});

