import { Routes } from '@angular/router';
import { UserComponent } from './user/user.component';
import { RegistrationComponent } from './user/registration/registration.component';
import { LoginComponent } from './user/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LobbyComponent } from './lobby/lobby.component';
import { GameComponent } from './game/game.component';
import { NewGameComponent } from './game/new-game-ui/new-game-ui.component';
import { NewGameRaceComponent } from './game/new-game-ui-race/new-game-ui-race.component';

export const routes: Routes = [
    {path: 'new-game-ui-race', component: NewGameRaceComponent},
    {path: 'new-game-ui', component: NewGameComponent},
    {path: 'game', component: GameComponent},
    {path: 'lobby', component: LobbyComponent},
    {path: '', redirectTo: '/signin', pathMatch: 'full' },
    {path:'', component:UserComponent,
        children:[
            {path:'signup',component:RegistrationComponent},
            {path:'signin',component:LoginComponent}
        ]
    },
    { path: 'dashboard', component: DashboardComponent }
];