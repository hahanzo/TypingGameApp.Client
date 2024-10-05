import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserComponent } from './user/user.component';
import { RegistrationComponent } from './user/registration/registration.component';
import { DashboardComponent } from './dashboard/dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UserComponent, RegistrationComponent, DashboardComponent],
  templateUrl: './app.component.html',
  styles: [],
})
export class AppComponent {
  title = 'TypingGameApp.Client';
}
