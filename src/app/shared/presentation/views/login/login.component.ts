import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../plants/profile/services/profile.services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private router = inject(Router);
  private userService = inject(UserService);

  email = '';
  password = '';

  onSignIn() {
    if (!this.email || !this.password) {
      alert('Por favor ingrese correo y contraseña.');
      return;
    }

    this.userService.getUserByEmail(this.email).subscribe({
      next: (user) => {
        if (user && user.password === this.password) {
          localStorage.setItem('isLoggedIn', 'true');
          this.router.navigate(['/dashboard']);
        } else {
          alert('Credenciales inválidas o usuario no encontrado.');
        }
      },
      error: (err) => {
        console.error('Error login:', err);
        alert('Error al intentar iniciar sesión.');
      }
    });
  }
}
