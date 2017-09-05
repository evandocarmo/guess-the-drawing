import {
  Component, Input, ElementRef, AfterViewInit, ViewChild, OnInit, OnDestroy
} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { SocketService } from '../socket.service';
import { Instructions } from '../instructions';
import { Options } from '../options';
import { Router } from '@angular/router';

import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/pairwise';
import 'rxjs/add/operator/switchMap';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements AfterViewInit, OnInit, OnDestroy {
  subscription: Subscription; //Subscription that represents the socket
  name: string = localStorage.getItem('name'); //Home page stores theses values in local storage
  room: string = localStorage.getItem('room');

  //CANVAS RELATED VARIABLES
  private cx: CanvasRenderingContext2D; //Object interface that holds the canvas configuration
  private options: Options = { //this Options object can be altered by the user
    lineWidth: 3,
    lineCap: "round",
    strokeStyle: "#000"
  };
  @ViewChild('canvas') public canvas: ElementRef;
  @Input() public width = 400;
  @Input() public height = 400;

  //CHAT MESSAGE BOX VARIABLES
  myMessage: string; //The current user's message
  chatMessages: string[] = []; //array that holds chat messages sent and received

  //ANSWERS BOX VARIABLES
  myAnswer: string;
  answers: string[] = [];

  constructor(private socketService: SocketService, private router: Router) { }

  ngOnInit() {
    if (!this.name || !this.room) //if these values are not stored
      this.router.navigate(['/']); // go back to the home page
    this.subscription = this.socketService.connect(this.room).subscribe(data => {
      if (data.type === "new-drawingInstructions")
        this.drawOnCanvas(data.instructions, data.options); //Listen to changes on the canvas and draw them on this canvas
      if (data.type === "new-message")
        this.chatMessages.push(data.text);
      if (data.type === "new-answer")
        this.answers.push(data.text);
    });
  }
  ngOnDestroy() {
    this.subscription.unsubscribe;
  }

  public ngAfterViewInit() {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx = canvasEl.getContext('2d'); //This allows us to set the characteristics of our canvas

    canvasEl.width = this.width;
    canvasEl.height = this.height;

    this.captureEvents(canvasEl);
  }

  private captureEvents(canvasEl: HTMLCanvasElement) {
    Observable //let's create an Observable
      .fromEvent(canvasEl, 'mousedown') //when the users presses the mouse down
      .switchMap((e) => { //switchMap discards the previous values and flattens the Observable
        return Observable //returns a new Observable
          .fromEvent(canvasEl, 'mousemove') //When the mouse moves
          .takeUntil(Observable.fromEvent(canvasEl, 'mouseup')) //that'll stop when the mouse is unpressed
          .pairwise() //emits the previous and current values as an array, returning the mouse down and the mouse move events
      })
      .subscribe((res: [MouseEvent, MouseEvent]) => {
        const rect = canvasEl.getBoundingClientRect(); //returns the size and position of the canvas rectangle
        let mouseDownEvent: MouseEvent = res[0];
        let mouseMoveEvent: MouseEvent = res[1];
        //We calculate the relative position of the mouse minus the borders of the canvas and save
        let instructions: Instructions = { prevPos: { x: 0, y: 0 }, currentPos: { x: 0, y: 0 } };
        instructions.prevPos = {
          x: mouseDownEvent.clientX - rect.left,
          y: mouseDownEvent.clientY - rect.top
        }
        instructions.currentPos = {
          x: mouseMoveEvent.clientX - rect.left,
          y: mouseMoveEvent.clientY - rect.top
        };
        this.socketService.sendDrawingInstructions(instructions, this.options); //send these instructions to all clienst
        this.drawOnCanvas(instructions, this.options);//draw them
      });
  }

  private drawOnCanvas(instructions: Instructions, options: Options) {
    if (!this.cx) { return; } //error checking
    this.cx.lineWidth = options.lineWidth;
    this.cx.lineCap = options.lineCap;
    this.cx.strokeStyle = options.strokeStyle;
    this.cx.beginPath();

    if (instructions.prevPos) {
      this.cx.moveTo(instructions.prevPos.x, instructions.prevPos.y); // from previous position
      this.cx.lineTo(instructions.currentPos.x, instructions.currentPos.y); //to current position
      this.cx.stroke(); //draw!
    }
  }
  private sendMessage() {
    this.socketService.sendMessage(this.myMessage);
    this.myMessage = '';
  }
  private sendAnswer() {
    this.socketService.sendAnswer(this.myAnswer);
    this.myAnswer = '';
  }
}
