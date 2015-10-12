var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};
var app = require('./lib/app');

var socketio = require('socket.io');
var util = require('util');//console.log(util.inspect(obj,false,null));でオブジェクトの中身をターミナルで確認できるようにする為



var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

function send404(response) {
	response.writeHead(404, {
		'Content-Type': 'text/plain'
	});
	response.write('Error 404: resource not found. ていうか見つかりません');
	response.end();
}

function sendFile(response, filePath, fileContents) {
	response.writeHead(
		200, {
			"content-type": mime.lookup(path.basename(filePath))
		}
	);
	response.end(fileContents);
}

function serveStatic(response, cache, absPath) {
	if (cache[absPath]) {
		sendFile(response, absPath, cache[absPath]);
	} else {
		fs.exists(absPath, function (exists) {
			if (exists) {
				fs.readFile(absPath, function (err, data) {
					if (err) {
						send404(response);
					} else {
						cache[absPath] = data;
						sendFile(response, absPath, data);
					}
				});
			} else {
				send404(response);
			}
		});
	}
}

var server = http.createServer(function (request, response) {
	var filePath = false;

	if (request.url == '/') {
		filePath = 'public/index.html';
	} else {
		filePath = 'public' + request.url;
	}

	var absPath = './' + filePath;
	serveStatic(response, cache, absPath);
});

var port = process.env.PORT || 3000;
server.listen(port, function () {
	console.log("Server listening on port 3000.");
});


var io = socketio.listen(server);
var icons = [];
var charasArr = [];
var ids = [];

io.set('log level', 1);

io.sockets.on('connection', function (socket) {
	console.log("入りました！！");
	console.log(charasArr);

	socket.chara = {};
	//io.sockets.socketsは配列になっている
	socket.emit('emit_fron_server_sendCharasArr', {charasArr: io.sockets.sockets.map(function(e) {
		return e.chara;//配列が生成される
	}), numOfIcon: io.sockets.sockets.length});
	console.log('91行目 : '+io.sockets.sockets.map(function(e) {
		console.log('92行目'+e.chara[1]);
		return e.chara;//配列が生成される
	}));
	socket.hoge = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
//	console.log(socket);
	console.log('clientから接続がありました');
	socket.on('emit_from_client', function (data) {
//		console.log(data);
		socket.emit('emit_from_server', 'you sended message ' + data);
		io.sockets.emit('emit_from_server', 'you sended message ' + data);
	});
	console.log('connection キター！');


	//iconのプロパティを更新する
	socket.on('emit_from_client_iconUpdate', function (data) {
		socket.chara = data;//socketオブジェクトの中にiconを格納
		console.log('103行目 : '+socket.chara);
		socket.broadcast.emit('emit_from_server_iconUpdate', data);
	});

	socket.on('client_from_emit_icon_draw', function (data) {
		io.sockets.emit('server_from_emit_icon_draw', data);
	});
	
	
	socket.on('emit_from_client_mkIconBtn', function (data) {
//		console.log(data);
	});

//----------------------------------------------------アクセス時
	//voiceChat.jsに記述
	socket.on('emit_from_client_join', function(data) {//dataはmyChara
		socket.chara.socketId = socket.id;
		socket.chara.Pos = data.Pos;
		socket.chara.textureImg = data.textureImg;
		socket.chara.peerId = data.peerId;
		socket.chara.mediaStreamMode = data.mediaStreamMode;
		console.log("join!!!!");
		console.log('131行目' + socket.chara.mediaStreamMode);
		var chara = {
			socketId: socket.chara.socketId,
			Pos: socket.chara.Pos,
			textureImg: socket.chara.textureImg,
			peerId: socket.chara.peerId,
			mediaStreamMode : socket.chara.mediaStreamMode
		};
//		charasArr.push(chara);
		socket.broadcast.emit('emit_from_server_join', {chara: chara, numOfChara: io.sockets.sockets.length});

	});


	socket.on('emit_from_client_charaPosChanged', function(data) {
		socket.chara.Pos = data;
socket.broadcast.emit('emit_from_server_charaPosChanged', {socketId: socket.id, Pos: data});
	});
	
	socket.on('emit_from_client_sendMsg', function(data) {
		socket.broadcast.emit('emit_from_server_sendMsg',{ socketId: socket.id, str: data.str, chatShowCount: data.chatShowCount});
	});
	
	
	socket.on('emit_from_client_voicePU', function(data) {
		socket.broadcast.emit('emit_from_server_voicePU', { socketId: socket.id ,voiceBallMeshScale: data});
	});
	
	//----------------------chat関連
	socket.on('emit_from_client_modeChange', function (data) {
		socket.chara.mediaStreamMode = data;
		console.log('162行目 : '+ data);
		console.log('163行目 : '+ socket.chara.mediaStreamMode);
		socket.broadcast.emit('emit_from_server_modeChange', { socketId: socket.id, mediaStreamMode: data});
	});

	socket.on('emit_from_client_peerCallConnected', function(data) {//dataはicon.socketId
//		console.log(data);
		socket.broadcast.emit('emit_from_server_peerCallConnected', {socketId: socket.id, talkingNodesSocketId: data});
	});

	socket.on('emit_from_client_peerCallDisconnected', function(data) {//dataはicon.socketId
//		console.log(data);
		socket.broadcast.emit('emit_from_server_peerCallDisconnected', {socketId: socket.id, talkingNodesSocketId: data});
	});
	
	socket.on('disconnect', function() {
		console.log('disconnect : ' + socket.id);
		//サーバー側のcharaはsocket.charaに格納されていて、disconnect時には勝手に消える為、削除処理不要
		socket.broadcast.emit('emit_from_server_charaRemove', { socketId: socket.id, numOfChara: io.sockets.sockets.length});
		
	});
});//---end---io.sockets.on('connection'





