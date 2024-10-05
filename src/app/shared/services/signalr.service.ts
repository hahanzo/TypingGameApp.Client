import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection;
  
  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/realtimehub') 
      .build();
    this.createConnection();
    this.startConnection();
  }

  private createConnection() {

    this.hubConnection.on('LobbyCreated', (lobby) => {
      console.log('Lobby Created:', lobby);
    });

    this.hubConnection.on('PlayerJoined', (player) => {
      console.log('Player Joined:', player);
    });

    this.hubConnection.on('GameStarted', (text) => {
      console.log('Game Started:', text);
    });

    this.hubConnection.on('TypingUpdate', (playerId, typedText) => {
      console.log(`Player ${playerId} typed: ${typedText}`);
    });

    this.hubConnection.on('GameEnded', (winnerId) => {
      console.log(`Game Ended. Winner: ${winnerId}`);
    });
  }

  private startConnection() {
    this.hubConnection
      .start()
      .then(() => console.log('Connection started'))
      .catch(err => console.log('Error while starting connection: ' + err));
  }

  public createLobby(difficulty: string) {
    this.hubConnection.invoke('CreateLobby', difficulty)
      .catch(err => console.error(err));
  }

  public joinLobby(lobbyId: string, playerName: string) {
    this.hubConnection.invoke('JoinLobby', lobbyId, playerName)
      .catch(err => console.error(err));
  }

  public startGame(lobbyId: string) {
    this.hubConnection.invoke('StartGame', lobbyId)
      .catch(err => console.error(err));
  }

  public sendTypingUpdate(lobbyId: string, typedText: string) {
    this.hubConnection.invoke('SendTypingUpdate', lobbyId, typedText)
      .catch(err => console.error(err));
  }

  public endGame(lobbyId: string, winnerId: string) {
    this.hubConnection.invoke('EndGame', lobbyId, winnerId)
      .catch(err => console.error(err));
  }
}
