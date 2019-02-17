const express = require('express');
const katana = express();
const http = require('http').Server(katana);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const mongo = require('mongodb').MongoClient;

mongo.connect('mongodb://localhost:27017/katana', (error, db) => {
	if (error) throw error;
	console.log('Connected to Katana DB');
	katana.use(express.static(__dirname + '/public'));

	function onConnection(socket) {
		console.log('client connected');
		// initialize new client with all previous paints
		db.collection('paint').find().sort({timestamp:1}).toArray((error, result) => {
			socket.emit('init', result);
			if (error) console.error(error);
		});

		socket.on('paint', (data) => {
			data.timestamp = new Date();
			db.collection('paint').save(data, (error, result) => {
				if (error) console.error(error);
			});
			socket.broadcast.emit('paint', data);
		});

		socket.on('clear', () => {
			db.collection('paint').drop((error, result) => {
				if (error) console.error(error);
				if (result) console.log("Drawings cleared!");
			});
			socket.broadcast.emit('clear');
		});
	}

	io.on('connection', onConnection);

	http.listen(port, () => console.log('running on port ' + port));
});
