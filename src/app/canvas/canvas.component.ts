import {
  Component, Input, ElementRef, AfterViewInit, ViewChild, OnInit, OnDestroy
} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { SocketService } from '../socket.service';
import { Instructions } from '../instructions';

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
  connection: Subscription;
  //captures the element marked as #canvas
  @ViewChild('canvas') public canvas: ElementRef;

  @Input() public width = 400;
  @Input() public height = 400;

  private cx: CanvasRenderingContext2D; //Object interface that holds the canvas configuration

  constructor(private socketService: SocketService) { }

  ngOnInit() {
    this.connection = this.socketService.getDrawingInstructions().subscribe(instructions => {
      this.drawOnCanvas(instructions);
    })
  }
  ngOnDestroy() {
    this.connection.unsubscribe;
  }

  public ngAfterViewInit() {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx = canvasEl.getContext('2d');

    canvasEl.width = this.width;
    canvasEl.height = this.height;

    this.cx.lineWidth = 3;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#000'; //takes a css color value

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
        //We calculate the relative position of the mouse minus the borders of the canvas
        let instructions : Instructions = {prevPos:{x:0,y:0},currentPos:{x:0,y:0}};
        instructions['prevPos'].x = mouseDownEvent.clientX - rect.left;
        instructions['prevPos'].y = mouseDownEvent.clientY - rect.top;

        instructions['currentPos'] = {
          x: mouseMoveEvent.clientX - rect.left,
          y: mouseMoveEvent.clientY - rect.top
        };
        this.socketService.sendDrawingInstructions(instructions);
        this.drawOnCanvas(instructions);
      });
  }

  private drawOnCanvas(instructions: Instructions) {
    if (!this.cx) { return; } //error checking

    this.cx.beginPath();

    if (instructions.prevPos) {
      this.cx.moveTo(instructions.prevPos.x, instructions.prevPos.y); // from previous position
      this.cx.lineTo(instructions.currentPos.x, instructions.currentPos.y); //to current position
      this.cx.stroke(); //draw!
    }
  }
}