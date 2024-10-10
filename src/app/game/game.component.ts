import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SignalRService } from '../shared/services/signalr.service';


@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
  styles: ``
})
export class GameComponent {
  title = "Typing Game";
  lobbyId: string | null = null;
  text: string | null = '';
  sentence: string[] = [];
  index = 0;
  letterIndex = 0;
  inputIndex = 0;
  userInput = "";
  errorMessage = "";
  correct = 0;
  errors = 0;
  possibleMistakes = 0;
  WPM = 0;
  accuracy = 0;
  time: number = 0;
  timeLeft: number = 0;
  timer: any = null;
  isGameOver = false;
  totalWordsTyped = 0;

  constructor(private signalRService: SignalRService, private router: Router){}

  ngOnInit(): void {
    this.signalRService.lobbyId$.subscribe(lobbyId => {
      this.lobbyId = lobbyId;
    });

    this.signalRService.gameText$.subscribe(text => {
      this.text = text;
    });

    this.signalRService.gameTime$.subscribe(time => {
      this.time = Number(time);
      this.timeLeft = Number(time);
    });
    
    this.startGame();
  }

  returnToLobby() {
    this.router.navigate(['/lobby']);
  }

  startGame() {
    if (this.timer) {
      clearInterval(this.timer); // Clear any existing timer
    }
    this.resetGameStats(); // Reset stats before starting
    this.generateSentence(String(this.text));
    this.startTimer(); // Start the timer when the game begins
  }

  generateSentence(text: string) {
    const words = text.split(" ").filter(word => word.length > 0); // Split the text into words
    const randomSentence = [];
    
    const uniqueWords = Array.from(new Set(words)); // Ensure unique words
    const sentenceLength = Math.min(10, uniqueWords.length); // Ensure we do not exceed available unique words

    for (let i = 0; i < sentenceLength; i++) {
      const randomIndex = Math.floor(Math.random() * uniqueWords.length);
      randomSentence.push(uniqueWords[randomIndex]);
    }

    const generatedSentence = randomSentence.join("");
    this.possibleMistakes += generatedSentence.length; // Count characters (excluding spaces)
    this.sentence = randomSentence; // Set the generated sentence
  }

  startTimer = () => {
    this.isGameOver = false; // Reset game over status
    console.log("starting timer");
    this.timer = setInterval(() => {
      this.timeLeft--;

      if (this.timeLeft <= 0) {
        this.endTimer(); // End the game when time runs out
      }
    }, 1000);
  };

  endTimer = () => {
    clearInterval(this.timer);
    this.timer = null;
    this.isGameOver = true;
    this.getWPM();
    this.getAccuracy();
    this.signalRService.submitResult(String(this.lobbyId), this.WPM);
  };

  resetGameStats = () => {
    this.possibleMistakes = 0;
    this.sentence = [];
    this.accuracy = 0;
    this.correct = 0;
    this.errors = 0;
    this.letterIndex = 0;
    this.inputIndex = 0;
    this.WPM = 0;
    this.userInput = ""; // Reset user input
    this.errorMessage = ""; // Reset error message
    this.index = 0; // Reset index for sentence tracking
    this.totalWordsTyped = 0;
  };

  getWPM = () => {
    if(this.totalWordsTyped > 0){
      this.WPM = parseInt(((this.totalWordsTyped / this.time) * 60).toFixed(0)) || 0; // Calculate WPM correctly
    } else {
      this.WPM = 0;
    }
  };

  getAccuracy = () => {
    if(this.totalWordsTyped > 0){
      this.accuracy = parseInt(((this.possibleMistakes - this.errors) / this.possibleMistakes * 100).toFixed(2)) || 0;
    } else {
      this.accuracy = 0;
    }
  };

  checkLetter = (letter: string[], input: string) => {
    // If the timer has not started yet
    if (this.index === 0 && this.letterIndex === 0 && this.timer == null) {
      this.startTimer();
      this.correct = 0;
    }
    
    // Only proceed if the current input index matches the letter index
    if (this.letterIndex === this.inputIndex) {
      if (input === letter[this.letterIndex]) {
        this.letterIndex++;
        this.inputIndex++;
        this.correct++;
        this.errorMessage = "";
        return;
      } else {
        if (input !== "" && input !== " ") {
          this.errorMessage = `You mistyped the letter ${letter[this.letterIndex]}`;
          this.errors++;
        }
      }
    }
  };

  checkWord = (event: KeyboardEvent, word: string, index: number) => {
    if (event.keyCode !== 16) { // Ignore Shift key
      this.userInput = word;
  
      // Check if the game is over
      if (this.isGameOver) {
        return; // Do nothing if the game is over
      }
  
      // Split the current sentence word into an array of characters
      let temp: string[] = this.sentence[index].split("");
  
      // Check if the user input matches the character being typed
      if (this.inputIndex < temp.length) {
        this.checkLetter(temp, event.key);
      }
  
      // Check for the space key to validate the word
      if (event.which === 32) { // 32 is the key code for space
        // Check if the entire word has been typed correctly
        if (word.trim() === this.sentence[index]) {
          this.letterIndex = 0;
          this.inputIndex = 0;
          this.index++;
          this.userInput = "";
          this.errorMessage = "";
          this.totalWordsTyped++
        }

        if (this.index === this.sentence.length) {
          this.index = 0; // Reset index to allow new sentence generation
          this.generateSentence(String(this.text)); // Generate new sentence
        }
      }
    }
  };  
}

