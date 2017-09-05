import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { SocketService } from './socket.service';
import { AppComponent } from './app.component';
import { CanvasComponent } from './canvas/canvas.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  {path:'home',component:HomeComponent},
  {path:'game',component:CanvasComponent},
  {path:'',redirectTo:'home',pathMatch:'full'}
];

@NgModule({
  declarations: [
    AppComponent,
    CanvasComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(routes)
  ],
  exports:[
    AppComponent,
    CanvasComponent
  ],
  providers: [SocketService],
  bootstrap: [AppComponent]
})
export class AppModule { }
