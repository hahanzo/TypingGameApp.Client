import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SignalRService } from '../shared/services/signalr.service';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dashboard.component.html',
  styles: ``
})
export class DashboardComponent {

  difficulty: string = 'Easy'; // Default difficulty
  difficulties: string[] = ['Easy', 'Medium', 'Hard']; // Difficulty levels

  options: string[] = ['Easy', 'Medium', 'Hard'];
  selectedOption: string = 'Easy';

  onOptionSelected(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log('Selected:', selectedValue);
  }
  constructor(private router: Router,
    private signalRService: SignalRService
  ) { }

  createLobby(): void {
    this.signalRService.createLobby(this.difficulty);
  }
  onLogout() {
    localStorage.removeItem('token');
    this.router.navigateByUrl('/signin');
  }
}
