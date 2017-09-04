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
		db.collection('object').find().sort({timestamp:1}).forEach((data, error) => {
			socket.emit('object_new', data);
			if (error) console.log('Failed to get initial objects');
		});

		socket.on('object_new', (data) => {
			data.timestamp = new Date();
			db.collection('object').save(data, (error, result) => {
				if (error) console.log('failed to write to DB');
			});
			socket.broadcast.emit('object', data);
		});

		socket.on('object_update', (data) => {
			data.timestamp = new Date();
			var id = data._id;
			delete data._id;
			console.log(data);
			db.collection('object').update({"_id": id}, {$set: data}, (error, result) => {
				if (error) console.log('failed to write to DB');
			});
			db.collection('object').findOne({"_id": id}, (error, result) => {
				if (error) console.log('failed to read from DB');
				console.log(result);
				socket.broadcast.emit('object_update', result);
			});
		});
	}

	io.on('connection', onConnection);

	http.listen(port, () => console.log('running on port ' + port));
});
