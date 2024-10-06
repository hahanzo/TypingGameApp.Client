import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject, BehaviorSubject  } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection;
  
  private lobbyIdSubject = new BehaviorSubject<string | null>(null);
  public lobbyId$ = this.lobbyIdSubject.asObservable();

  private playerJoinedSubject$ = new BehaviorSubject<string[]>([]);

  private gameStartedSubject = new Subject<{ text: string, timer: number }>();
  private gameEndedSubject = new Subject<{ winner: string, wpm: number }>();

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5198/gamehub')
      .build();
  }

  startConnection(): void {
    this.hubConnection
      .start()
      .then(() => console.log('Connection started'))
      .catch(err => console.log('Error while starting connection: ' + err));
    
      this.hubConnection.on('UpdatePlayerList', (playerNames: string[]) => {
        this.playerJoinedSubject$.next(playerNames);
      });
  }

  createLobby(username: string, difficulty: string, timer: number): Promise<string> {
    this.hubConnection.off('CreateLobby');
    this.hubConnection.on('CreateLobby', lobbyId => {
      this.lobbyIdSubject.next(lobbyId);
      console.log(`Lobby was created with id: ${lobbyId}`);
    });
    return this.hubConnection.invoke('CreateLobby',username, difficulty, timer);
  }

  deleteLobby(lobbyId: string) {
    this.hubConnection.off('LobbyDeletedSuccessfully');
    this.hubConnection.on('LobbyDeletedSuccessfully', message => {
      this.lobbyIdSubject.next(null);
      console.log(message);
    });
    this.hubConnection.invoke('DeleteLobby', lobbyId)
  }

  joinLobby(lobbyId: string): void {
    this.hubConnection.off('PlayerJoined');
    this.hubConnection.on('PlayerJoined', message => {
      console.log("Player with id joined:",message);
    });
    this.hubConnection.invoke('JoinLobby', lobbyId);
  }

  leaveLobby(lobbyId: string): void {
    this.hubConnection.invoke('LeaveLobby', lobbyId);
  }

  startGame(lobbyId: string): void {
    this.hubConnection.invoke('StartGame', lobbyId);
    this.hubConnection.on('StartGame', (text, timer) => {
      this.gameStartedSubject.next({ text, timer });
    });
  }

  submitResult(lobbyId: string, playerId: string, wpm: number): void {
    this.hubConnection.invoke('SubmitResult', lobbyId, playerId, wpm);
    this.hubConnection.on('GameEnded', (winner, wpm) => {
      this.gameEndedSubject.next({ winner, wpm });
    });
  }
}
