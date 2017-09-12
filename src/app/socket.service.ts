import { Observable } from 'rxjs/Observable';
import * as io from 'socket.io-client';
import { Instructions } from './instructions';
import { Options } from './options';
import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { Message } from './message';

@Injectable() //Injectable declaration allows service to be injected with a provider, in this case, the router
export class SocketService {
  private socket;

  constructor(private router: Router) { }

  connect(room: string = "1", name: string): Observable<any> { //Method that creates the socket. Takes a room as parameter
    if(!name)
      return;
    console.log('connecting');
    this.socket = io();
    this.socket.emit('join room', room, name); // joins the room specified

    let observable = new Observable(observer => {

      this.socket.on('message', (data) => { //when socket receives message
        observer.next(data); //observer pushes data through service
      });

      this.socket.on('clear',(data)=>{
        observer.next(data);
      })

      this.socket.on('drawingInstructions', (data) => {
        //data contains one object called instructions and one object called options
        observer.next(data);
      });

      this.socket.on('answer', (data) => { //socket receives answer message
        observer.next(data);
      });

      this.socket.on('disconnect', (reason) => {
        console.log(reason);
        this.router.navigate(['home']); //go back to home page if socket is disconnected
      });
      return () => {
        this.socket.disconnect();
      };
    })
    return observable;
  }
  sendMessage(message: Message) { //Method that emits to all clients a message
    this.socket.emit('add-message', message);
  }
  sendDrawingInstructions(instructions: Instructions, options: Options) { //Method that emits drawing instructions to all clients
    this.socket.emit('add-drawingInstructions', instructions, options);
  }
  sendAnswer(answer: Message) { //emits answer message
    this.socket.emit('add-answer', answer);
  }
  sendClear(){
    this.socket.emit('clear');
  }
}
