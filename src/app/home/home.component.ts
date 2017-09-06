import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  name: string;
  room: string;

  constructor(private router: Router) { }

  ngOnInit() {
  }

  enterRoom(){
    if(!this.name || !this.room)
      return;
    else
      localStorage.setItem('name',this.name);
      localStorage.setItem('room',this.room);
      this.router.navigate(['/game']);
  }
}
