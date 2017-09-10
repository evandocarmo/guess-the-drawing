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
  styleUrls: ['./canvas.component.css'],
  host:{ //host option allows us to access the window object, calling a component method when window is resized
    '(window:resize)': 'onResize($event)'
  }
})
export class CanvasComponent implements AfterViewInit, OnInit, OnDestroy {
  subscription: Subscription; //Subscription that represents the socket
  name: string = localStorage.getItem('name'); //Home page stores theses values in local storage
  room: string = localStorage.getItem('room');

  //CANVAS RELATED VARIABLES
  //To make sure drawing looks the same in all screens, we have to multiply the drawing coordinates
  // By the ratio of the original canvas (500px) and the reduced canvas on mobile, as set on the CSS file (310px)
  //If the mobile device's screen width is bigger than 568px, it fits the original canvas, and the ratio is set to 1
  mobileRatio : number = window.screen.width < 568 ? 1.61290323 : 1;
  canvasEl: HTMLCanvasElement;
  private cx: CanvasRenderingContext2D; //Object interface that holds the canvas configuration
  public options: Options = { //this Options object can be altered by the user
    lineWidth: 3,
    lineCap: "round",
    strokeStyle: "#000"
  };
  @ViewChild('canvas') public canvas: ElementRef;
  @Input() public width = 500;
  @Input() public height = 250;

  //CHAT MESSAGE BOX VARIABLES
  myMessage: string; //The current user's message
  chatMessages: string[] = []; //array that holds chat messages sent and received

  //ANSWERS BOX VARIABLES
  myAnswer: string;
  answers: string[] = [];

  constructor(private socketService: SocketService, private router: Router) { }
  onResize(event){ //if the screen is resized, recalculate the mobile ratio
    this.mobileRatio = event.target.innerWidth < 568 ? 1.61290323 : 1;
  }
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
    this.canvasEl = this.canvas.nativeElement;
    this.cx = this.canvasEl.getContext('2d'); //This allows us to set the characteristics of our canvas
    this.canvasEl.width = this.width;
    this.canvasEl.height = this.height;

    this.captureEvents(this.canvasEl);
  }

  captureEvents(canvasEl: HTMLCanvasElement) {
    Observable //let's create an Observable to listen for mouse clicks
      .fromEvent(this.canvasEl, 'mousedown') //when the users presses the mouse down
      .switchMap((e) => { //switchMap discards the previous values and flattens the Observable
        return Observable //returns a new Observable
          .fromEvent(this.canvasEl, 'mousemove') //When the mouse moves
          .takeUntil(Observable.fromEvent(this.canvasEl, 'mouseup')) //that'll stop when the mouse is unpressed
          .pairwise() //emits the previous and current values as an array, returning the mouse down and the mouse move events
      })
      .subscribe((res: [MouseEvent, MouseEvent]) => {
        let mouseDownEvent: MouseEvent = res[0];
        let mouseMoveEvent: MouseEvent = res[1];
        //We save the mouse coordinates in a Instructions object
        let instructions: Instructions = { prevPos: { x: 0, y: 0 }, currentPos: { x: 0, y: 0 } };
        instructions.prevPos = {
          x: mouseDownEvent.clientX,
          y: mouseDownEvent.clientY
        }
        instructions.currentPos = {
          x: mouseMoveEvent.clientX,
          y: mouseMoveEvent.clientY
        };
        this.socketService.sendDrawingInstructions(instructions, this.options); //send these instructions to all clienst
        this.drawOnCanvas(instructions, this.options);//draw them
      });

    Observable //now let's listen for mobile touches
      .fromEvent(canvasEl, 'touchstart')
      .switchMap((e: Event) => {
        e.preventDefault();//prevents scrolling when drawing on the canvas
        return Observable
          .fromEvent(canvasEl, 'touchmove')
          .takeUntil(Observable.fromEvent(canvasEl, 'touchend'))
          .pairwise()
      }).subscribe((res: [TouchEvent, TouchEvent]) => {
        let previousTouch = res[0].touches[0];
        let currentTouch = res[1].touches[0];
        let instructions: Instructions = { prevPos: { x: 0, y: 0 }, currentPos: { x: 0, y: 0 } };
        instructions.prevPos = { //Multiply the instructions by the mobile ratio
          x: Math.round(previousTouch.clientX * this.mobileRatio),
          y: Math.round(previousTouch.clientY * this.mobileRatio)
        }
        instructions.currentPos = {
          x: Math.round(currentTouch.clientX * this.mobileRatio),
          y: Math.round(currentTouch.clientY * this.mobileRatio)
        };
        this.socketService.sendDrawingInstructions(instructions, this.options); //send these instructions to all clients
        this.drawOnCanvas(instructions, this.options);//draw them
      });
  }

  drawOnCanvas(instructions: Instructions, options: Options) {
    if (!this.cx) { return; } //error checking
    this.cx.lineWidth = options.lineWidth;
    this.cx.lineCap = options.lineCap;
    this.cx.strokeStyle = options.strokeStyle;
    this.cx.beginPath();
    const rect = this.canvasEl.getBoundingClientRect(); //returns the size and position of the canvas rectangle
    if (instructions.prevPos) { //get instructions and subtract them from rectangular size
      this.cx.moveTo(instructions.prevPos.x - rect.left, instructions.prevPos.y - rect.top); // from previous position
      this.cx.lineTo(instructions.currentPos.x - rect.left, instructions.currentPos.y - rect.top); //to current position
      this.cx.stroke(); //draw!
    }
  }
  sendMessage() {
    this.socketService.sendMessage(this.myMessage);
    this.myMessage = '';
  }
  sendAnswer() {
    this.socketService.sendAnswer(this.myAnswer);
    this.myAnswer = '';
  }
}
