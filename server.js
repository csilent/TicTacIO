//Mango set up
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;
var client = new MongoClient("mongodb://localhost:27017", { useNewUrlParser: true });
var db;

var fs = require('fs');  //File system stuff
var key = fs.readFileSync('encryption/myKey.pem'); //sync here means it blocks until the whole file is loaded (unusual for node.js, but ok in this case)
var cert = fs.readFileSync( 'encryption/myCert.crt' );
var options = {
  key: key,
  cert: cert
};

//Express setup
var express = require("express");
var app = express();
var https = require("https");
var secureServer = https.createServer(options, app);
var http = require("http");
var insecureServer = http.createServer(app);
//SocketIO setup
var socketio = require("socket.io");
var io = socketio(secureServer);
//Global vars
var loginInfo;
var usersTiles;
var playerData=[];
var games=[];
var shopTileSwitch = 0;
var xShopItems=[		// 1st elem are the actual items. numbers are pts required to buy..
	{id: 1, img:'img/xImg/cat.jpg', pts: 2},
	{id: 2, img:'img/xImg/dog.jpg', pts: 2},
	{id: 3, img:'img/xImg/flower.jpeg', pts: 3},
	{id: 4, img:'img/xImg/godzilla.jpg', pts: 2},
	{id: 5, img:'img/xImg/jarjar.jpg', pts: 2},
	{id: 6, img:'img/xImg/masterChief.jpg', pts: 3},
	{id: 7, img:'img/xImg/mountain.jpg', pts: 5},
	{id: 8, img:'img/xImg/rocket.png', pts: 3},
	{id: 9, img:'img/xImg/space.jpg', pts: 4}
];
var oShopItems=[		// 1st elem are the items. numbers are pts required to buy..
	{id: 1, img:'img/oImg/soccer.jpg', pts: 2},
	{id: 2, img:'img/oImg/baseball.jpg', pts: 2},
	{id: 3, img:'img/oImg/donkeykong.jpg', pts: 3},
	{id: 4, img:'img/oImg/firefighter.jpg', pts: 2},
	{id: 5, img:'img/oImg/fredflintstone.jpg', pts: 2},
	{id: 6, img:'img/oImg/luigi.jpg', pts: 3},
	{id: 7, img:'img/oImg/mario.jpg', pts: 5},
	{id: 8, img:'img/oImg/volcano.jpg', pts: 3},
	{id: 9, img:'img/oImg/wolverine.jpg', pts: 4}
];
var purchasedXtiles=[];	// populate this when you query the db collection. Used for building buildPurchasedTable() 
var purchasedOtiles=[];

app.use(function(req, res, next) {
    if (req.secure) {
        next();
    } else {
        res.redirect('https://' + req.headers.host + req.url);
    }
});

app.use(express.static("pub"));
function getOpposite(piece){
	if(piece==='o'){
		return 'x';
	}
	else if(piece==='x'){
		return 'o';
	}
	return 'blank';
}
function hashString(str){
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
		hash = hash & hash;
	}
	return hash;
}
function buildShopTable(){	 
	var table = document.createElement("table");	
	var i = 0;
	for(var r=0;r<3;r++){
		var row = table.insertRow(-1);
		for(c=0;c<3;c++){
			var col = row.insertCell(-1);
			col.appendChild(document.createTextNode(shopItems[i++]));
		}
	}
	document.body.appendChild(table);
}

function buildNewShopTable() {
	var tmp = "<table>";
	for(var i = 0; i < 3; i++) {
		tmp += "<tr>";
		for(var j = 0; j < 3; j++) {
			for(var pic in xShopItems) {
				tmp += "<td><img src="+xShopItems[pic].img+" class=\"gameTile\", id=\"shopTable\"> <br>"+xShopItems[pic].pts+"</td>";
			}
		}
		tmp += "</tr>";
	}
	tmp += "</table>";
	return tmp;
}

function buildXshopTable() {
	var tmpp = "<table><tr>";
	for(var ting in xShopItems){
		tmpp += "<td><img src="+xShopItems[ting].img+" class=\"gameTile\"> <br>"+xShopItems[ting].pts+"</td>";
	}
	tmpp += "</tr></table>";
	return tmpp;
}

function buildOshopTable() {
	var tmpp = "<table><tr>";
	for(var ting in oShopItems){
		tmpp += "<td><img src="+oShopItems[ting].img+" class=\"gameTile\"> <br>"+oShopItems[ting].pts+"</td>";
	}
	tmpp += "</tr></table>";
	return tmpp;
}
function buildPurchasedTable() {
	/* query the usersTiles collection, insert each element from collection into new purchase array, build a new table based on purchase array.  */
	purchasedXtiles = usersTiles.find();	// idk if I can access items like this.

}

function winCheck(gameBoard,piece){
	let n=gameBoard.length;
	for(i=0;i<n;i++){
		if(gameBoard[i][0]===piece){
			let win=true;
			for(j=0;j<n;j++){
				win=win&&(gameBoard[i][j]===piece);
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
				win=win&&(gameBoard[j][i]===piece);
			}
			if(win){
				return true;
			}
		}
	}
	if(gameBoard[0][0]===piece){
		let win=true;
		for(i=0;i<n;i++){
			win=win&&(gameBoard[i][i]===piece);
		}
		if(win){
			return true;
		}
	}
	if(gameBoard[0][n-1]===piece){
		let win=true;
		for(i=1;i<n;i++){
			let b=(n-(1+i));
			win=win&&(gameBoard[i][b]===piece);
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
		if(gameBoard[i].indexOf("blank")!=-1){
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
	let count=0;
	let ret="<table>";
	for(var game in games){
		count++;
		ret+="<tr><th>"+games[game].name+"</th></tr>"
	}
	ret+="</table>";
	return count===0 ? "There are currently no games to join":ret;
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
function getMovesHtml(team,teamName){
	var ret="Special Moves: "+teamName+"<br>";
	ret+="Remove Moves: "+team.removeMoves.toString()+"<br>";
	ret+="Double Moves: "+team.doubleMoves.toString();
	return ret;
}
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
function getNumPlayers(room){
	if(isEmpty(io.sockets.adapter.rooms[room])){
		return 0;
	}
	return io.sockets.adapter.rooms[room].length;
}
function getGameBoardHtml(gameBoard,xpic,opic){
	var ret="<table>";
	for(i=0;i<gameBoard.length;i++){
		ret+="<tr>";
		for(j=0;j<gameBoard.length;j++){
			if(gameBoard[i][j]==="x"){
				ret+="<td> <img src=img/"+xpic+".png class=\"gameTile\"></td>";
			}
			else if(gameBoard[i][j]==="o"){
				ret+="<td> <img src=img/"+opic+".png class=\"gameTile\"></td>";
			}
			else{
				ret+="<td> <img src=img/"+gameBoard[i][j]+".png class=\"gameTile\"></td>";
			}

		}
		ret+="</tr>";
	}
	ret+="</table>"
	return ret;
}
function createGameBoard(n){
	var gameBoard=new Array(n);
	for(i=0;i<n;i++){
		var row=new Array(n);
		for(j=0;j<n;j++){
			row[j]="blank";
		}
		gameBoard[i]=row;
	}
	return gameBoard;
}
io.on("connection", function(socket) {
	console.log("Somebody connected.");
	socket.join('preLobby');
	socket.on("disconnect", function() {
		console.log("Somebody disconnected.");
		if(socket.id in playerData){
			let room=playerData[socket.id].room;
			if(room!='lobby'){
				if(getNumPlayers(room)<1){
					delete games[room];
					io.to('lobby').emit("updateGames",getGamesHtml());
				}
			}
			socket.leaveAll();
			if(getNumPlayers(room)>=1){
				io.to(room).emit("updatePlayers",getPlayersHtml(room));
			}
			delete playerData[socket.id];
		}
		else{
			socket.leaveAll();
		}
	});
	socket.on("login", function(dataFromClient,successFunction) {
		loginInfo.find({userName:dataFromClient.userName}).toArray(function(err, result) {
			if(result.length>0&&result[0].password===hashString(dataFromClient.password)){
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
				loginInfo.insertOne({userName:dataFromClient.userName,password:hashString(dataFromClient.password)});
				joinMainLobby(socket,dataFromClient.userName);
				successFunction(true);
			}else{
				console.log("name exists");
				successFunction(false);
			}
		});
	});
	socket.on("newGame", function(boardSize,numOfRemoveMoves,numOfDoubleMoves){
		socket.leaveAll();
		let firstTeam='x';
		if(Math.random()>.5){
			firstTeam='o';
		}
		games[playerData[socket.id].name]={
			name:playerData[socket.id].name,
			gameBoardSize:boardSize,
			gameBoard:createGameBoard(boardSize),
			turn:firstTeam,
			x:{removeMoves:numOfRemoveMoves,doubleMoves:numOfDoubleMoves,picture:"x",currentMove:"placePiece"},
			o:{removeMoves:numOfRemoveMoves,doubleMoves:numOfDoubleMoves,picture:"o",currentMove:"placePiece"}
		};
		let roomString=playerData[socket.id].name;
		playerData[socket.id].room=roomString;
		socket.join(roomString);
		io.to('lobby').emit("updateGames",getGamesHtml());
		io.to(roomString).emit("updatePlayers",getPlayersHtml(roomString));
		io.to(roomString).emit("updateGameBoard",getGameBoardHtml(games[roomString].gameBoard,games[roomString].x.picture,games[roomString].o.picture));
		io.to(roomString).emit("updateSpecialMoves",getMovesHtml(games[roomString].x,"x"),getMovesHtml(games[roomString].o,"o"));
		playerData[socket.id].team='o';
	});
	socket.on("getMoveType",function(getMove){
		if(playerData[socket.id].team==="o"){
			console.log(games[playerData[socket.id].room].o.currentMove);
			getMove(games[playerData[socket.id].room].o.currentMove);
		}
		else if(playerData[socket.id].team==="x"){
			console.log(games[playerData[socket.id].room].x.currentMove);
			getMove(games[playerData[socket.id].room].x.currentMove);
		}
	});
	socket.on("changeMoveType",function(moveType){
		if(playerData[socket.id].team==="o"){
			games[playerData[socket.id].room].o.currentMove=moveType;
		}
		else if(playerData[socket.id].team==="x"){
			games[playerData[socket.id].room].x.currentMove=moveType;
		}
	});
	socket.on("placePiece",function(x,y,errorFunction){
		console.log("Placing piece at "+x+":"+y);
		if(games[playerData[socket.id].room].turn===playerData[socket.id].team){
			if(games[playerData[socket.id].room].gameBoard[x][y]==="blank"){
				games[playerData[socket.id].room].gameBoard[x][y]=playerData[socket.id].team;
				games[playerData[socket.id].room].turn=getOpposite(playerData[socket.id].team);
				io.to(playerData[socket.id].room).emit("updateGameBoard",getGameBoardHtml(games[playerData[socket.id].room].gameBoard,games[playerData[socket.id].room].x.picture,games[playerData[socket.id].room].o.picture));
				if(winCheck(games[playerData[socket.id].room].gameBoard,playerData[socket.id].team)){
					io.to(playerData[socket.id].room).emit("gameWon",playerData[socket.id].team);
					games[playerData[socket.id].room].turn="blank";
				}
				else if(fullBoardCheck(games[playerData[socket.id].room].gameBoard)){
					io.to(playerData[socket.id].room).emit("fullGameBoard");
					games[playerData[socket.id].room].turn="blank";
				}
			}
			else{
				errorFunction("This square is already occupied");
			}
		}
		else{
			errorFunction("It is not your turn");
		}
	});
	socket.on("removeMove",function(x,y,errorFunction){
		console.log("Removing piece at "+x+":"+y);
		let removeMovesCount=0;
		if(playerData[socket.id].team==="o"){
			removeMovesCount= games[playerData[socket.id].room].o.removeMoves;
		}
		else if(playerData[socket.id].team==="x"){
			removeMovesCount=games[playerData[socket.id].room].x.removeMoves;
		}
		if(games[playerData[socket.id].room].turn===playerData[socket.id].team){
			if(removeMovesCount>0){
				if(games[playerData[socket.id].room].gameBoard[x][y]===getOpposite(playerData[socket.id].team)){
					games[playerData[socket.id].room].gameBoard[x][y]="blank";
					games[playerData[socket.id].room].turn=getOpposite(playerData[socket.id].team);
					io.to(playerData[socket.id].room).emit("updateGameBoard",getGameBoardHtml(games[playerData[socket.id].room].gameBoard,games[playerData[socket.id].room].x.picture,games[playerData[socket.id].room].o.picture));
					if(winCheck(games[playerData[socket.id].room].gameBoard,playerData[socket.id].team)){
						io.to(playerData[socket.id].room).emit("gameWon",playerData[socket.id].team);
						games[playerData[socket.id].room].turn="blank";
					}
					else if(fullBoardCheck(games[playerData[socket.id].room].gameBoard)){
						io.to(playerData[socket.id].room).emit("fullGameBoard");
						games[playerData[socket.id].room].turn="blank";
					}
					if(playerData[socket.id].team==="o"){
						games[playerData[socket.id].room].o.removeMoves--;
						games[playerData[socket.id].room].o.currentMove="placePiece";
					}
					else if(playerData[socket.id].team==="x"){
						games[playerData[socket.id].room].x.removeMoves--;
						games[playerData[socket.id].room].x.currentMove="placePiece";
					}
					io.to(playerData[socket.id].room).emit("updateSpecialMoves",getMovesHtml(games[playerData[socket.id].room].x,"x"),getMovesHtml(games[playerData[socket.id].room].o,"o"));
				}
				else{
					errorFunction("Must remove an piece from the opposite team");
				}
			}
			else{
				errorFunction("Not enough remove moves left");
			}
		}
		else{
			errorFunction("It is not your turn");
		}
	});
	socket.on("doubleMove",function(x,y,errorFunction){
		let doubleMovesCount=0;
		if(playerData[socket.id].team==="o"){
			doubleMovesCount= games[playerData[socket.id].room].o.doubleMoves;
		}
		else if(playerData[socket.id].team==="x"){
			doubleMovesCount=games[playerData[socket.id].room].x.doubleMoves;
		}
		console.log("Double move at "+x+":"+y);
		if(games[playerData[socket.id].room].turn===playerData[socket.id].team){
			if(doubleMovesCount>0){
				if(games[playerData[socket.id].room].gameBoard[x][y]==="blank"){
					games[playerData[socket.id].room].gameBoard[x][y]=playerData[socket.id].team;
					io.to(playerData[socket.id].room).emit("updateGameBoard",getGameBoardHtml(games[playerData[socket.id].room].gameBoard,games[playerData[socket.id].room].x.picture,games[playerData[socket.id].room].o.picture));
					if(winCheck(games[playerData[socket.id].room].gameBoard,playerData[socket.id].team)){
						io.to(playerData[socket.id].room).emit("gameWon",playerData[socket.id].team);
						games[playerData[socket.id].room].turn="blank";
					}
					else if(fullBoardCheck(games[playerData[socket.id].room].gameBoard)){
						io.to(playerData[socket.id].room).emit("fullGameBoard");
						games[playerData[socket.id].room].turn="blank";
					}
					if(playerData[socket.id].team==="o"){
						games[playerData[socket.id].room].o.doubleMoves--;
						games[playerData[socket.id].room].o.currentMove="placePiece";
					}
					else if(playerData[socket.id].team==="x"){
						games[playerData[socket.id].room].x.doubleMoves--;
						games[playerData[socket.id].room].x.currentMove="placePiece";
					}
					io.to(playerData[socket.id].room).emit("updateSpecialMoves",getMovesHtml(games[playerData[socket.id].room].x,"x"),getMovesHtml(games[playerData[socket.id].room].o,"o"));
				}
				else{
					errorFunction("This square is already occupied");
				}
			}
			else{
				errorFunction("Not enough double moves left");
			}
		}
		else{
			errorFunction("It is not your turn");
		}
	});
	socket.on("getGames",function(setHtml){
		setHtml(getGamesHtml());
	});
	socket.on("joinedLobby",function(){
		io.to('lobby').emit("updateGames",getGamesHtml());
	});
	socket.on("shopMenu",function(){
		socket.leaveAll();
		socket.join('shop');
		playerData[socket.id].room='shop';
		socket.emit("updateShop", buildXshopTable());
		io.emit("updateItemSelection");  // FIX - item Selection()
	});
	socket.on("oshopMenu",function(){
		socket.leaveAll();
		socket.join('shop');
		playerData[socket.id].room='shop';
		socket.emit("updateShop", buildOshopTable());
	});
	socket.on("purchaseTiles",function() {
		/* purchase selected tile(s). */
		usersTiles.insertOne(xShopItems[1]);	// What did this insert into the db. - Test
		// store selected items in usersTiles db collection
		// remove the purchased tile from remaining available tile options
		// call buildPurchasedTable() to update purchase table.
	});
	socket.on("leaveShop",function(){
		socket.leaveAll();
		socket.join('lobby');
		playerData[socket.id].room='lobby';
		io.to("updateGames",getGamesHtml());
	});
	socket.on("joinGame",function(gameName,successFunction){
		if(getNumPlayers(gameName)<2){
			socket.leaveAll();
			socket.join(gameName);
			playerData[socket.id].room=gameName;
			io.to(gameName).emit("updatePlayers",getPlayersHtml(gameName));
			io.to(gameName).emit("updateGameBoard",getGameBoardHtml(games[gameName].gameBoard,games[gameName].x.picture,games[gameName].o.picture));
			playerData[socket.id].team='x';
			io.to(gameName).emit("updateSpecialMoves",getMovesHtml(games[gameName].x,"x"),getMovesHtml(games[gameName].o,"o"));
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
		io.emit("updateGames",getGamesHtml());
	});
	socket.on("getPlayers",function(setHtml){
		setHtml(getPlayersHtml(playerData[socket.id].room));
	});
	socket.on("sendChat", function(textMessageFromClient) {
		var s = new Date();
		io.emit("sayAll", s.getHours() + ":" +  s.getMinutes() + ":" + s.getSeconds() + " " + playerData[socket.id].name + " >  " + textMessageFromClient);
	});
});
client.connect(function(err) {
	if (err != null) throw err;
	else {
		db = client.db("TicTacIO");
		loginInfo=db.collection("loginInfo");
		usersTiles=db.collection("tilePurchases");
		secureServer.listen(443, function() {console.log("Secure server is ready.");});
		insecureServer.listen(80, function() {console.log("Insecure (forwarding) server is ready.");});
	}
});