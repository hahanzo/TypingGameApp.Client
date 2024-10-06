import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SignalRService } from '../../shared/services/signalr.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [],
  templateUrl: './lobby.component.html',
  styles: ``
})
export class LobbyComponent{
  lobbyId: string | null = null;

  constructor(private router: Router,
    private signalRService: SignalRService,
    private toastr: ToastrService){}

  ngOnInit(): void {
    this.signalRService.lobbyId$.subscribe(lobbyId => {
      this.lobbyId = lobbyId;
    });
  }

  deleteLobby() {
    if (this.lobbyId) {
      this.signalRService.deleteLobby(this.lobbyId);
      this.toastr.info('The lobby has been removed.');
      this.router.navigate(['/dashboard']);
    }
  }
}
