exports.Room = class {
  constructor(name, io, socket) {
    this.name = name;
    this.players = [];
    this.io = io;
    this.socket = socket;
    this.drawing = [];
  }
  artist;
  word = 'cat';
  emitUpdate() {
    this.io.sockets.in(this.name).emit('update', {
      type: 'update',
      data: this
    });
  }
  update(room) {
    this.players = room.players;
    this.artist = room.artist;
    this.word = room.word;
  }
  join(player) {
    this.players.push(player);
    this.emitUpdate();
  }
  disconnect(player) {
    if (player.id === this.artist.id) {
      this.assignArtist();
    }
    let index = this.players.indexOf(player);
    this.players.splice(index, 1);
    this.emitUpdate();
  }
  assignArtist() {
    if (this.artist) {
      players.push(this.artist);
    }
    this.artist = this.players.shift();
    this.io.sockets.socket(this.artist.id).emit('artist', {
      type: 'artist',
      message: "You're the artist now!"
    });
    this.io.sockets.socket(this.artist.id).emit('word', {
      type: 'word',
      message: this.word
    });
    this.emitUpdate();
  }
  startRound() {
    this.assignArtist();
    this.drawing = [];

    this.socket.on('add-answer', (answer) => {
      this.io.sockets.in(roomCode).emit('answer', {
        type: 'new-answer',
        text: answer,
        user: socket['user']
      });
      if (answer === this.word) {
        //TODO add points
        this.startRound();
      }
    });
    this.socket.on('add-drawingInstructions', (instructions, options) => {
      let drawingInstructions = {
        type: 'new-drawingInstructions',
        instructions: instructions,
        options: options,
        user: socket['user']
      };
      this.io.sockets.in(roomCode).emit('drawingInstructions', drawingInstructions);
      this.drawing.push(drawingInstructions);
      this.emitUpdate();
    });
    this.socket.on('clear', () => {
      this.io.sockets.in(roomCode).emit('clear', {
        type: 'clear',
        user: socket['user']
      });
      this.drawing = [];
    });
    this.socket.on('add-message', (message) => {
      this.io.sockets.in(roomCode).emit('message', {
        type: 'new-message',
        text: message,
        user: socket['user']
      });
    });

    setTimeout(() => {
      this.startRound();
    }, 30000);
  }
}
