import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/presentation/views/main-layout/main-layout.component';
import { DashboardComponent } from './shared/presentation/views/dashboard/dashboard.component';
import { MyCropsComponent } from './shared/presentation/views/my-crops/my-crops.component';
import { MyFieldsComponent } from './shared/presentation/views/my-fields/my-fields.component';
import { MyTasksComponent } from './shared/presentation/views/my-tasks/my-tasks.component';
import { CommunityComponent } from './shared/presentation/views/community/community.component';
import { LoginComponent } from './shared/presentation/views/login/login.component';
import { authGuard } from './shared/infrastructure/guards/auth.guard';
import { loginGuard } from './shared/infrastructure/guards/login.guard';
import { CropFormComponent } from './shared/presentation/views/my-crops/my-crops-form/my-crops-form.component';
import { FieldDetailsComponent } from './shared/presentation/views/my-fields/field-details/field-details.component';
import { AddFieldComponent } from './shared/presentation/views/my-fields/add-field/add-field.component';
import { ProfileComponent } from './shared/presentation/views/profile/profile.component';
import { RegisterComponent } from './shared/presentation/views/register/register.component';

export const routes: Routes = [
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [loginGuard] // Solo este guard
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard],
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'my-crops', component: MyCropsComponent },
      { path: 'my-crops/add', component: CropFormComponent },
      { path: 'my-fields', component: MyFieldsComponent },
      { path: 'my-fields/add', component: AddFieldComponent },
      { path: 'my-fields/:id', component: FieldDetailsComponent },
      { path: 'my-tasks', component: MyTasksComponent },
      { path: 'community', component: CommunityComponent },
      { path: 'profile', component: ProfileComponent }
    ]
  },
  { path: '**', redirectTo: 'register' }
];
