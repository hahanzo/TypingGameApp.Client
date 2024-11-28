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
  templateUrl: './new-game-ui-race.component.html',
  styleUrls: ['./new-game-ui-race.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom
})

export class NewGameRaceComponent{
  lobbyId: string | null = null;
  text: Word[] = ["asdf","asdf","asdf","asdf","asdf","asdf","asdf","asdf"];
  seed: string | null = null;
  
  game: Game = 'waiting for input'
  seconds: number = 0;

  private destroy$ = new Subject<void>(); 
  private interval$ = interval(1000);

  typedLetter = '';
  typeWord = '';

  words: Word[] = [];

  wordIndex = 0;
  letterIndex = 0;

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
    });
    
    this.words = this.generateRandomWords(this.text, this.seed!, 5)
    
    this.startGame();
  }

  generateRandomWords(wordArray: string[], seed: string, numWords: number): string[] {
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
    const isWordCompleted = this.letterIndex > this.words[this.wordIndex].length;

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
    } else {
      this.renderer.addClass(this.letterEl, 'incorrect');
      this.renderer.removeClass(this.letterEl, 'correct');
    }
  }

  previousLetter(): void {
    if (this.letterIndex > 0) {
      this.moveCaretPrevious();
      this.letterIndex -= 1;
      this.resetCurrentLetterState();
    }
  }

  resetCurrentLetterState(): void {
    const currentLetterEl = this.wordsEl.nativeElement
      .getElementsByClassName('word')[this.wordIndex]
      .getElementsByClassName('letter')[this.letterIndex] as HTMLSpanElement;
  
    if (currentLetterEl) {
      this.renderer.removeClass(currentLetterEl, 'correct');
      this.renderer.removeClass(currentLetterEl, 'incorrect');
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
        this.wordIndex += 1;
        this.letterIndex = 0;
        this.moveCaretToWord();
      }
    }
  }

  moveCaret() {
    const offset = 4;
    this.caretEl.nativeElement.style.top = `${this.letterEl?.offsetTop! + offset}px`;
    this.caretEl.nativeElement.style.left = `${this.letterEl?.offsetLeft! + this.letterEl?.offsetWidth!}px`;
  }

  moveCaretPrevious() {
    const offset = 4;
    const wordEl = this.wordsEl.nativeElement.children[this.wordIndex];
    this.letterEl = wordEl?.getElementsByClassName('letter')[this.letterIndex] as HTMLSpanElement;
    
    if (this.letterEl) {
      this.caretEl.nativeElement.style.top = `${this.letterEl?.offsetTop! + offset}px`;
      this.caretEl.nativeElement.style.left = `${this.letterEl?.offsetLeft! - this.letterEl?.offsetWidth!}px`;
    }
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
        this.seconds += 1

        if (this.wordIndex > this.words.length) {
          this.setGameState('game over'); 
          this.stopGameTimer();
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
    } else if (event.code === 'Backspace') {
      event.preventDefault();
      if (this.game === 'in progress') {
        this.previousLetter();
      }
    }
  }

  ngAfterViewInit(): void {
    this.focusInput();
  }
}
