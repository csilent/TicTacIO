/*
	To set up client side:
		In HTML: 		<script src="/socket.io/socket.io.js" type="text/javascript"></script>
		In client.js	var socket = io();
*/


var socket = io();

socket.on("sayAll", function(dataFromServer) {
	console.log("The server said: " + dataFromServer);
});

function startItAll() {
	socket.emit("sayHello", "Hello world");
	socket.emit("sayHello", 42);
	socket.emit("sayHello", {name: "Mike", age: 99});
}




$(startItAll);