import { Observable } from 'rxjs/Observable';
import * as io from 'socket.io-client';
import { Instructions } from './instructions';

export class SocketService {
  private url = 'http://localhost:5000';
  private socket;

  sendMessage(message) {
    this.socket.emit('add-message', message);
  }
  sendDrawingInstructions(instructions : Instructions) {
    this.socket.emit('add-drawingInstructions', instructions);
  }
  getMessages() { //method returns Observable that can be subscribed to
    let observable = new Observable(observer => {
      this.socket = io(this.url);
      this.socket.on('message', (data) => { //when socket receives message
        observer.next(data); //observer pushes data through service
      });
      return () => {
        this.socket.disconnect();
      };
    })
    return observable;
  }
  getDrawingInstructions() : Observable<Instructions> {
    let observable = new Observable(observer => {
      this.socket = io(this.url);
      this.socket.on('drawingInstructions',(data) => {
        console.log(data.instructions);
        observer.next(data.instructions);
      });
      return () => {
        this.socket.disconnect();
      };
    })
    return observable;
  }
}
