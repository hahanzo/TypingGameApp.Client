import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SignalRService } from '../shared/services/signalr.service';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { jwtDecode } from 'jwt-decode';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styles: ``
})

export class DashboardComponent {
  difficulty: string = 'easy';  // default difficulty
  timer: number = 60;           // default timer value in seconds
  lobbyId: string | null = null;
  joinlobbyId: string | null = null;
  username: string | null = null;

  constructor(private router: Router,
    private signalRService: SignalRService,
    private toastr: ToastrService) 
  { 
    this.signalRService.startConnection();
  }

  ngOnInit(): void {
    this.signalRService.lobbyId$.subscribe(lobbyId => {
      this.lobbyId = lobbyId;
    });

    const token = localStorage.getItem('jwt'); // Assuming you stored the token in local storage
    if (token) {
      const decoded: any = jwtDecode(token);
      this.username = decoded.username; // Adjust this depending on your JWT structure
    }
  }
  
  onLogout() {
    localStorage.removeItem('token');
    this.router.navigateByUrl('/signin');
  }

  createLobby() {
    if (this.lobbyId) {
      this.toastr.warning('You already have an active lobby. Delete it before creating a new one.');
    } else {
      this.signalRService.createLobby(String(this.username), this.difficulty, this.timer).then(lobbyId => {
        this.toastr.success('Lobby successfully created!');
        this.router.navigate(['/lobby']);
      });
    }
  }

  deleteLobby() {
    if (this.lobbyId) {
      this.signalRService.deleteLobby(this.lobbyId);
      this.toastr.info('The lobby has been removed.');
    }
  }

  joinLobby() {
    if(this.joinlobbyId){
      this.signalRService.joinLobby(this.joinlobbyId);
      this.toastr.success('Joining the lobby was successful');
      this.router.navigate(['/lobby']);
    }
  }
}
