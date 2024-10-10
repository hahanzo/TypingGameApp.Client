import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../shared/services/signalr.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lobby.component.html',
  styles: ``
})
export class LobbyComponent{
  lobbyId: string | null = null;
  players: string[] = [];

  constructor(private signalRService: SignalRService){}

  ngOnInit(): void {
    this.signalRService.lobbyId$.subscribe(lobbyId => {
      this.lobbyId = lobbyId;
    });

    this.signalRService.playerJoined$.subscribe(players => {
      this.players = players;
    });

    // this.signalRService.gameText$.subscribe(text => {
    //   console.log(text);
    // })

    // this.signalRService.gameTime$.subscribe(time => {
    //   console.log(time);
    // })
  }

  deleteLobby() {
    if (this.lobbyId) {
      this.signalRService.deleteLobby(this.lobbyId);
    }
  }

  leaveLobby(){
    if(this.lobbyId) {
      this.signalRService.leaveLobby(this.lobbyId);
    }
  }

  startGame(){
    if(this.lobbyId) {
      this.signalRService.startGame(this.lobbyId);
    }
  }
}
