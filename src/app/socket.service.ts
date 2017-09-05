import { Observable } from 'rxjs/Observable';
import * as io from 'socket.io-client';
import { Instructions } from './instructions';
import { Options } from './options';

export class SocketService {
  private url = 'http://localhost:5000';
  private socket;

  sendMessage(message: string) { //Method that emits to all clients a message
    this.socket.emit('add-message', message);
  }
  sendDrawingInstructions(instructions: Instructions, options: Options) { //Method that emits drawing instructions to all clients
    this.socket.emit('add-drawingInstructions', instructions, options);
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
  getDrawingInstructions(): Observable<any> { //Same logic as previous method.
    let observable = new Observable(observer => {
      this.socket = io(this.url);
      this.socket.on('drawingInstructions', (data) => {
        //data contains one object called instructions and one object called options
        observer.next(data);
      });
      return () => {
        this.socket.disconnect();
      };
    })
    return observable;
  }
}
