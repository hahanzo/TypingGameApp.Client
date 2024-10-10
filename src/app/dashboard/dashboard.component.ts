import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SignalRService } from '../shared/services/signalr.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styles: ``
})

export class DashboardComponent {
  difficulty: string = 'easy';
  timer: number = 60;
  lobbyId: string | null = null;
  joinlobbyId: string | null = null;

  constructor(private router: Router,
    private signalRService: SignalRService) 
  { 
    this.signalRService.startConnection();
  }

  ngOnInit(): void {
    this.signalRService.lobbyId$.subscribe(lobbyId => {
      this.lobbyId = lobbyId;
    });
  }
  
  onLogout() {
    localStorage.removeItem('token');
    this.router.navigateByUrl('/signin');
  }

  createLobby() {
    this.signalRService.createLobby(this.difficulty, this.timer);
  }

  deleteLobby() {
    if (this.lobbyId) {
      this.signalRService.deleteLobby(this.lobbyId);
    }
  }

  joinLobby() {
    if(this.joinlobbyId){
      this.signalRService.joinLobby(this.joinlobbyId);
    }
  }
}
