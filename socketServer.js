let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);

let room;

io.on('connection', (socket) => { //When a user connects...
  console.log('user connected');

  socket.on('join room', (roomName) => { //and emits a 'join room' event, make it join that room
    room = roomName; //set the variable socket.room to save the user provided room name
    socket.join(room);
    console.log(room);
  });

  socket.on('disconnect', function() {
    console.log('user disconnected');
  });

  socket.on('add-drawingInstructions', (instructions, options) => {
    console.log(room);
    io.sockets.in(room).emit('drawingInstructions', {
      type: 'new-drawingInstructions',
      instructions: instructions,
      options: options
    })
  });
  socket.on('add-answer', (answer) => {
    io.sockets.in(room).emit('answer', {
      type: 'new-answer',
      text: answer
    });
  });
  socket.on('add-message', (message) => {
    io.sockets.in(room).emit('message', {
      type: 'new-message',
      text: message
    });
  });
});

http.listen(5000, () => {
  console.log('started on port 5000');
});
