const express = require('express');
let app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');
const {
  Player
} = require('./Player');
const file = './animals.txt';
app.use(express.static(__dirname + '/dist'));
app.use((req, res) => res.sendfile(__dirname + '/dist/index.html'));
http.lastPlayerId = 0;

/*
  When only one user is online, they are asked to wait for a second player.
  When a second player comes in, first player is assigned artist role, receives a word, timer starts.
  When time is up or word is guessed, next person is assigned artist role, receives a word, timer starts.

  class Room {
    string Name;
    Player artist;
    Player[] players;
    startRound(){
      - assign new artist
      - send word to artist
      - start counter
      - listen to answers
      - if answer is correct or time is up
        startRound()
    }
  }
*/

function getAllPlayers(roomCode) {
  let players = [];
  Object.keys(io.sockets.adapter.rooms[roomCode].sockets).forEach((socketId) => {
    let player = io.sockets.connected[socketId].player;
    if (player)
      players.push(player);
  });
  return players;
}

function invalid(roomCode,text = 'Something is wrong') {
  io.sockets.in(roomCode).emit('Invalid', {
    type: 'invalid',
    text: text
  });
  console.log(text);
}

function newArtist(roomCode,room,socket) {
  let players = getAllPlayers(roomCode);
  for (let player of players){
    console.log(player);
    if(player.role !== 'artist'){
      room.artist = player;
      player.role = 'artist';
      io.sockets.connected[player.socket].emit('role',{
        type:'role',
        data:'artist'
      });      
    }
    else if(player.role === 'artist'){
      player.role = 'player';
      io.sockets.connected[player.socket].emit('role',{
        type:'role',
        data:'player'
      });
    }
  }
}

function setSession(roomCode,room,socket){
  setTimeout(()=>{
    newArtist(roomCode,room,socket);
    console.log(`Time's up. ${room.artist.name} is now the artist`);
    setSession(roomCode,room,socket);
  },1000)
}

io.on('connection', (socket) => { //When a user connects...
  let roomCode;
  console.log('user connected', new Date().toLocaleString());

  socket.on('join room', (roomCodeInput, username) => { //and emits a 'join room' event, make it join that room
    if (!roomCodeInput || !username) { //if room or username are not provided
      socket.disconnect(true);
      return;
    }
    roomCode = roomCodeInput;
    socket['player'] = new Player(username, http.lastPlayerId,socket.id);
    http.lastPlayerId = socket.player.id;
    socket.join(roomCode);
    socket.to(roomCode).emit('new-player', socket.player);

    room = io.sockets.adapter.rooms[roomCode]; //room object containing the connected sockets, length, etc

    room['valid'] = false;

    if (getAllPlayers(roomCode).length === 1) {
      socket.player.role = 'artist';
      socket.emit('role',{
        type:'role',
        role:'artist'
      });
      room['artist'] = socket;
    } else {
      socket.player.role = 'player';
    }
    if(getAllPlayers(roomCode).length === 2) {
      room.valid = true;
      setSession(roomCode,room,socket);
    }
  });
  socket.on('disconnect', function () {
    console.log(socket.id);
    if (getAllPlayers(roomCode).length < 2)
      room.valid = false;
    else {
      if (socket.id === room.artist) {
        for (let player in room.sockets) {
          if (player !== socket.id) {
            room['artist'] = player;
          }
        }
      }
    }
  });
  socket.on('add-answer', (answer) => {
    if (!room.valid){
      invalid(roomCode);
      return;
    }
    if(socket.role === 'artist'){
      invalid(roomCode,`You're the arist and you can't answer`);
      return;
    }
    io.sockets.in(roomCode).emit('answer', {
      type: 'new-answer',
      text: answer,
      user: socket.player
    });
  });
  socket.on('add-drawingInstructions', (instructions, options) => {
    if (!room.valid) {
      invalid(roomCode);
      return;
    }
    if(socket.role !== 'artist'){
      invalid(roomCode, `You're not the artist. You can't draw.`);
      return;
    }
    let drawingInstructions = {
      type: 'new-drawingInstructions',
      instructions: instructions,
      options: options,
      user: socket['player']
    };
    console.log(room);
    io.sockets.in(roomCode).emit('drawingInstructions', drawingInstructions);
  });
  socket.on('clear', () => {
    if (!room.valid) {
      invalid(roomCode);
      return;
    }
    if(socket.role !== 'artist'){
      invalid(roomCode,`You're not the artist and you can't draw.`);
      return;
    }
    io.sockets.in(roomCode).emit('clear', {
      type: 'clear',
      user: socket['user']
    });
  });
  socket.on('add-message', (message) => {
    if (!room.valid) {
      invalid(roomCode);
      return;
    }
    io.sockets.in(roomCode).emit('message', {
      type: 'new-message',
      text: message,
      user: socket['user']
    });
  });
});
http.listen(process.env.PORT || 5000, () => {
  console.log(`started on port ${process.env.PORT || '5000'}`);
});
