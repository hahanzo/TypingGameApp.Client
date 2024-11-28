// game.component.ts
import { Component, ViewEncapsulation,  NgModule, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';  
import { FormsModule } from '@angular/forms'; 
import { Subject, interval, last } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { SignalRService } from '../../shared/services/signalr.service';
import { AnyCatcher } from 'rxjs/internal/AnyCatcher';
import seedrandom from 'seedrandom';

type Game = 'waiting for input' | 'in progress' | 'game over';
type Word = string;

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-game',
  templateUrl: './new-game-ui.component.html',
  styleUrls: ['./new-game-ui.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})

export class NewGameComponent {
  lobbyId: string | null = null;
  text: Word[] = [];
  seed: string | null = null;
  
  game: Game = 'waiting for input'
  seconds: number = 30;
  totalTime: number = 0;
  
  private destroy$ = new Subject<void>(); 
  private interval$ = interval(1000);
  
  wordsPerMinute: number = 0;
  accuracy: number = 0;

  typedLetter = '';

  words: Word[] = [];

  wordIndex = 0;
  letterIndex = 0;
  correctLetters = 0;
  correctWords = 0;
  totalLetters = 0;

  @ViewChild('inputEl') inputEl!: ElementRef<HTMLInputElement>;
  @ViewChild('wordsEl') wordsEl!: ElementRef<HTMLDivElement>;
  @ViewChild('caretEl') caretEl!: ElementRef<HTMLDivElement>;
  letterEl?: HTMLSpanElement;

  constructor(private renderer: Renderer2, private signalRService: SignalRService, private router: Router) {}

  ngOnInit(): void {
    this.signalRService.lobbyId$.subscribe(lobbyId => {
      this.lobbyId = lobbyId;
    });

    this.signalRService.gameSeed$.subscribe(gameSeed =>
      this.seed = gameSeed
    )

    this.signalRService.gameText$.subscribe(text => {
      this.text = text!.split(' ')
    });

    this.signalRService.gameTime$.subscribe(time => {
      this.seconds = Number(time);
      this.totalTime = Number(time);
    });
    
    this.words = this.generateRandomString(this.text, this.seed!, 30)
    
    this.startGame();
  }

  generateRandomString(wordArray: string[], seed: string, numWords: number): string[] {
    const rng = seedrandom(seed);  
    let result: string[] = [];

    for (let i = 0; i < numWords; i++) {
      const randomIndex = Math.floor(rng() * wordArray.length); 
      result.push(wordArray[randomIndex]);
    }

    return result;
  }

  isSpace(part: string): boolean {
    return part.trim() === '';
  }

  updateGameState() {
    this.setLetter();
    this.checkLetter();
    this.nextLetter();
    this.resetLetter();
    this.updateLine();
    this.moveCaret();
  }

  setLetter() {
    const isWordCompleted = this.letterIndex > this.words[this.wordIndex].length - 1;

    if(!isWordCompleted){
      this.letterEl = this.wordsEl.nativeElement
      .getElementsByClassName('word')[this.wordIndex]
      .getElementsByClassName('letter')[this.letterIndex] as HTMLSpanElement;
    }
  }

  checkLetter() {
    const currentLetter = this.words[this.wordIndex][this.letterIndex];
    const lastTypedLetter = this.typedLetter.charAt(this.typedLetter.length - 1);

    if (lastTypedLetter === currentLetter) {
      this.renderer.addClass(this.letterEl, 'correct');
      this.renderer.removeClass(this.letterEl, 'incorrect');
      this.increaseScore();
      this.totalLetters++;
    } else {
      this.renderer.addClass(this.letterEl, 'incorrect');
      this.renderer.removeClass(this.letterEl, 'correct');
      this.totalLetters++;
    }
  }
 
  nextLetter() {
    this.letterIndex += 1;
  }

  resetLetter() {
    this.typedLetter = '';
  }

  updateLine() {
    const wordEl = this.wordsEl.nativeElement.children[this.wordIndex];
    const wordsY = this.wordsEl.nativeElement.getBoundingClientRect().y;
    const wordY = wordEl.getBoundingClientRect().y;
    
    if(wordY > wordsY) {
      wordEl.scrollIntoView({block: 'center'});
      this.words.push(...this.generateRandomString(this.text, this.seed!, 10))
    }
  }

  increaseScore() {
    this.correctLetters++;
  }

  getWordsPerMinute(): number {
    const minutes = this.totalTime/60;
    return this.correctWords / minutes;
  }

  getAccuracy(): number {
    return Math.floor((this.correctLetters / this.totalLetters) * 100);
  }

  getTotalLetters(words: Word[]): number {
    return words.reduce((count, word) => count + word.length, 0);
  }

  calculateMetrics() {
    this.wordsPerMinute = this.getWordsPerMinute();
    this.accuracy = this.getAccuracy();
  }

  getTotalLetter(words: Word[]) {
    return words.reduce((count, word) => count + word.length, 0);
  }

  getResults() {
    if (this.game === 'game over') {
      this.calculateMetrics();
      this.signalRService.submitResult(String(this.lobbyId), this.wordsPerMinute);
    }
  }

  nextWord() {
    const isNotFirstLetter = this.letterIndex !== 0;
    const isOneLetterWord = this.words[this.wordIndex].length === 1;
    const letters = this.wordsEl.nativeElement
    .getElementsByClassName('word')[this.wordIndex]
    .getElementsByClassName('letter correct');
    
    const word = Array.from(letters).map(letter => letter.textContent).join('');

    if(isNotFirstLetter || isOneLetterWord) {
      if(this.words[this.wordIndex] === word){
        this.correctWords++;
      }
      this.wordIndex += 1;
      this.letterIndex = 0;
    }
    
    this.moveCaretToWord();
  }

  moveCaret() {
    const offset = 4;
    this.caretEl.nativeElement.style.top = `${this.letterEl?.offsetTop! + offset}px`;
    this.caretEl.nativeElement.style.left = `${this.letterEl?.offsetLeft! + this.letterEl?.offsetWidth!}px`;
  }

  moveCaretToWord() {
    const wordEl = this.wordsEl.nativeElement.children[this.wordIndex];
    const firstLetterEl = wordEl ? wordEl.getElementsByClassName('letter')[0] as HTMLSpanElement : null;
  
    if (wordEl && firstLetterEl) {
      const offset = 4; 
      this.caretEl.nativeElement.style.top = `${firstLetterEl.offsetTop! + offset}px`;
      this.caretEl.nativeElement.style.left = `${firstLetterEl.offsetLeft!}px`;
    }
  }

  startGame() {
    this.setGameState('in progress');
    this.startGameTimer();
  }

  setGameState(state: Game) {
    this.game = state;
  }

  startGameTimer(): void {
    this.interval$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.game === 'waiting for input' || this.seconds === 0) {
          this.stopGameTimer();
        }

        if (this.seconds > 0) {
          this.seconds -= 1; 
        }

        if (this.seconds === 0) {
          this.setGameState('game over'); 
          this.getResults();
        }
      });
  }

  focusInput() {
    this.inputEl.nativeElement.focus();
  }

  stopGameTimer(): void {
    this.destroy$.next();
  }

  returnToLobby(){
    this.router.navigate(['/lobby']);
  }

  handleKeydown(event: KeyboardEvent): void {
    if(event.code === 'Space'){
      event.preventDefault();
      if(this.game === 'in progress') {
        this.nextWord();
      }
    }
  }

  ngAfterViewInit(): void {
    this.focusInput();
  }
}
