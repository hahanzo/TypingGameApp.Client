import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject, BehaviorSubject  } from 'rxjs';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection;
  
  private lobbySubject = new BehaviorSubject<any>(null);
  private lobby$: Observable<any>  = this.lobbySubject.asObservable();

  private playerJoinedSubject = new BehaviorSubject<string[]>([]);
  public playerJoined$: Observable<string[]> = this.playerJoinedSubject.asObservable();

  private lobbyIdSubject = new BehaviorSubject<string | null>(null);
  public lobbyId$: Observable<string | null> = this.lobbyIdSubject.asObservable();

  private gameTextSubject = new BehaviorSubject<string | null>(null);
  public gameText$: Observable<string | null> = this.gameTextSubject.asObservable();

  private gameTimeSubject  = new BehaviorSubject<string | null>(null);
  public gameTime$: Observable<string | null> = this.gameTimeSubject.asObservable();

  private gameSeedSubject  = new BehaviorSubject<string | null>(null);
  public gameSeed$: Observable<string | null> = this.gameSeedSubject.asObservable();

  private lobbyUI = new BehaviorSubject<string | null>(null);

  private playerId: string | null = null;
  private username: string | null = null;

  constructor(private router: Router,
    private toastr: ToastrService) 
  {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('')
      .build();

      const token = localStorage.getItem('token');
      if (token) {
        const decoded: any = jwtDecode(token);
        this.playerId = decoded.UserID;
        this.username = decoded.UserName;
        console.log(`Plaeyr joined Id:${this.playerId} UserName:${this.username }`);
      }
  }

  startConnection(): void {
    this.hubConnection
      .start()
      .then(() => console.log('Connection started'))
      .catch(err => console.log('Error while starting connection: ' + err));

      this.addListeners();
  }

  private addListeners() {
    //Create lobbu listeners
    this.hubConnection.off('LobbyCreationError');
    this.hubConnection.on('LobbyCreationError', message => {
      this.toastr.warning(message);
    });

    this.hubConnection.off('CreateLobby');
    this.hubConnection.on('CreateLobby', (lobby, lobbyId) => {
      this.lobbySubject.next(lobby);
      const playerNames = lobby.players.map((player: { userName: any; }) => player.userName);
      this.playerJoinedSubject.next(playerNames);
      this.lobbyUI = lobby.lobbyUI;
      this.lobbyIdSubject.next(lobbyId);
      this.toastr.success('Lobby successfully created!');
      this.router.navigate(['/lobby']);
      console.log(`Lobby was created with id: ${lobbyId}`);
    });

    //Delete lobby listeners
    this.hubConnection.off('LobbySuccessError');
    this.hubConnection.on('LobbySuccessError', message => {
      this.toastr.error(message)
    });

    this.hubConnection.off('LobbyDeletedMessage');
    this.hubConnection.on('LobbyDeletedMessage', message => {
      this.lobbyIdSubject.next(null);
      this.router.navigate(['/dashboard']);
      this.toastr.info(message)
    });

    this.hubConnection.off('LobbyDeletedSuccessfully');
    this.hubConnection.on('LobbyDeletedSuccessfully', message => {
      this.toastr.info(message);
      this.router.navigate(['/dashboard']);
      console.log(message);
    });

    this.hubConnection.off('LobbyDeletedError');
    this.hubConnection.on('LobbyDeletedError', message => {
      this.toastr.info(message);
      this.router.navigate(['/dashboard']);
      this.lobbyIdSubject.next(null);
      console.log(message);
    });

    //Join lobby listeners
    this.hubConnection.off('PlayerConnectionExist');
    this.hubConnection.on('PlayerConnectionExist', message => {
      this.router.navigate(['/lobby']);
      this.toastr.info(message)
    });

    this.hubConnection.off('PlayerJoined');
    this.hubConnection.on('PlayerJoined', (lobby, username, lobbyId) => {
      this.lobbySubject.next(lobby);
      this.lobbyIdSubject.next(lobbyId);
      const playerNames = lobby.players.map((player: { userName: any; }) => player.userName);
      this.lobbyUI = lobby.lobbyUI;
      this.lobbyIdSubject.next(lobbyId);
      this.playerJoinedSubject.next(playerNames);
      this.toastr.success(`Player ${username} joined to lobby`);
      this.router.navigate(['/lobby']);
      console.log(`Player ${username} joined`);
    });

    //Leave lobby listeners
    this.hubConnection.off('PlayerLeft');
    this.hubConnection.on('PlayerLeft', (lobby, username, lobbyId) => {
      this.lobbySubject.next(lobby);
      this.lobbyIdSubject.next(lobbyId);
      const playerNames = lobby.players.map((player: { userName: any; }) => player.userName);
      this.playerJoinedSubject.next(playerNames);
      this.toastr.info(`Player ${username} left the lobby`);
      if(this.username === username) {
        this.router.navigate(['/dashboard']);
      }
      console.log(`Player ${username} left the lobby`);
    });

    //Start game listeners
    this.hubConnection.off('StartGame');
    this.hubConnection.on('StartGame', (seed, text, timer) => {
      this.gameSeedSubject.next(seed);
      this.gameTextSubject.next(text);
      this.gameTimeSubject.next(timer);
      this.router.navigate([`/${this.lobbyUI}`]);
    });

    this.hubConnection.off('StartGameMessage');
    this.hubConnection.on("StartGameMessage", message => {
      this.toastr.success(message);
    });

    //Submit result listeners
    this.hubConnection.off('GameStartSuccessError');
    this.hubConnection.on('GameStartSuccessError', message => {
      this.toastr.error(message)
    });

    this.hubConnection.off('GameEnded');
    this.hubConnection.on('GameEnded', (winner, wpm) => {
      this.toastr.info(`Winer of game ${winner} with wpm ${wpm}`);
    });
  }

  createLobby(difficulty: string, timer: number, lobbyUI:string): Promise<string> {
    return this.hubConnection.invoke('CreateLobby', this.username, difficulty, timer, lobbyUI);
  }

  deleteLobby(lobbyId: string) {
    this.hubConnection.invoke('DeleteLobby', lobbyId)
  }

  joinLobby(lobbyId: string): void {
    this.hubConnection.invoke('JoinLobby', this.username, lobbyId);
  }

  leaveLobby(lobbyId: string): void {
    this.hubConnection.invoke('LeaveLobby', this.username, lobbyId);
  }

  startGame(lobbyId: string): void {
    this.hubConnection.invoke('StartGame', lobbyId);
  }

  submitResult(lobbyId: string, wpm: number): void {
    this.hubConnection.invoke('SubmitResult', lobbyId, this.username, wpm);
  }
}
