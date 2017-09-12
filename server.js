const express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);

app.use(express.static(__dirname + '/dist'));

app.use((req, res) => res.sendfile(__dirname + '/dist/index.html'));

let room;
let user = {
  name: null
};

io.on('connection', (socket) => { //When a user connects...
  console.log('user connected', new Date().toLocaleString());

  socket.on('join room', (roomName, username) => { //and emits a 'join room' event, make it join that room
    if (!roomName || !username) { //if room or username are not provided
      socket.disconnect(true);
      return;
    }
    room = roomName; //set the variable socket.room to save the user provided room name
    user.name = username;
    socket.join(room);
    console.log(room);
  });

  socket.on('disconnect', function() {
    console.log('user disconnected');
  });

  socket.on('add-drawingInstructions', (instructions, options) => {
    io.sockets.in(room).emit('drawingInstructions', {
      type: 'new-drawingInstructions',
      instructions: instructions,
      options: options,
      user: user
    })
  });
  socket.on('add-answer', (answer) => {
    io.sockets.in(room).emit('answer', {
      type: 'new-answer',
      text: answer,
      user: user
    });
  });
  socket.on('clear', () => {
    io.sockets.in(room).emit('clear', {
      type: 'clear',
      user: user
    });
  });
  socket.on('add-message', (message) => {
    io.sockets.in(room).emit('message', {
      type: 'new-message',
      text: message,
      user: user
    });
  });
});

http.listen(process.env.PORT || 5000, () => {
  console.log(`started on port ${process.env.PORT || '5000'}`);
});
