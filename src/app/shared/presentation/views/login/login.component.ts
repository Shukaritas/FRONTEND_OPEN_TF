import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../plants/profile/services/profile.services';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    RouterLink,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private router = inject(Router);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  email = '';
  password = '';
  hide: boolean = true;
  loading = false;

  private showNotification(key: string, actionKey: string = 'NOTIFICATIONS.CLOSE', duration: number = 3000) {
    const action = this.translate.instant(actionKey);
    this.translate.get(key).subscribe(message => {
      this.snackBar.open(message, action, {
        duration,
        verticalPosition: 'bottom',
        horizontalPosition: 'center'
      });
    });
  }

  onSignIn() {
    if (!this.email || !this.password) {
      this.showNotification('LOGIN.MISSING_CREDENTIALS');
      return;
    }
    this.loading = true;

    this.userService.login(this.email, this.password).subscribe({
      next: (response) => {
        const token = response?.token;
        const userId = response['id'] || response['userId'];
        if (!token) {
          this.showNotification('LOGIN.INVALID_RESPONSE');
          this.loading = false;
          return;
        }
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
        localStorage.setItem('isLoggedIn', 'true');
        if (userId) {
          localStorage.setItem('userId', String(userId));
        }
        this.router.navigate(['/dashboard']);
        this.showNotification('LOGIN.SUCCESS');
      },
      error: (err) => {
        console.error('Error login:', err);
        if (err.status === 401) {
          this.showNotification('LOGIN.INVALID_CREDENTIALS');
        } else {
          this.showNotification('LOGIN.ERROR');
        }
        this.loading = false;
      }
    });
  }
}
