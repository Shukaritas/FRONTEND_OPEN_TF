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
  loading = false;

  onSignIn() {
    if (!this.email || !this.password) {
      alert('Por favor ingrese correo y contraseña.');
      return;
    }
    this.loading = true;

    this.userService.login(this.email, this.password).subscribe({
      next: (response) => {
        const token = response?.token;
        const userId = response['id'] || response['userId'];
        if (!token) {
          alert('Respuesta inválida del servidor: falta token.');
          this.loading = false;
          return;
        }
        localStorage.setItem('token', token); // Clave 'token' como indicó el usuario
        localStorage.setItem('authToken', token);
        localStorage.setItem('isLoggedIn', 'true'); // Compatibilidad con guards actuales
        if (userId) {
          localStorage.setItem('userId', String(userId));
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error login:', err);
        if (err.status === 401) {
          alert('Credenciales inválidas.');
        } else {
          alert('Error al intentar iniciar sesión.');
        }
        this.loading = false;
      }
    });
  }
}
