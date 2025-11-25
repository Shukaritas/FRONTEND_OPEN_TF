import { Component, OnInit, inject, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import {UserService} from '../../../../plants/profile/services/profile.services';
import {User} from '../../../../plants/profile/domain/model/profile.entity';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import { UserEventsService } from '../../../infrastructure/services/user-events.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatSlideToggleModule,
    MatIconModule,
    TranslatePipe,
    MatSnackBarModule,
    MatFormFieldModule, // añadido para mat-form-field
    MatInputModule,     // añadido para matInput
    MatButtonModule     // añadido para mat-icon-button
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private userEvents = inject(UserEventsService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private platformId = inject(PLATFORM_ID);

  public user: User = new User();

  public currentPassword = '';
  public newPassword = '';
  public confirmNewPassword = '';

  public showCurrentPassword = false;
  public showNewPassword = false;
  public showConfirmPassword = false;

  private originalEmail: string = ''; // Email original para detectar cambios
  private originalUserName: string = '';

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

  ngOnInit() {
    // Proteger acceso a localStorage en SSR
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const storedId = localStorage.getItem('userId');
    if (!storedId) {
      // Sin sesión: redirigir a login
      this.router.navigate(['/login']);
      return;
    }
    const numericId = parseInt(storedId, 10);
    if (isNaN(numericId)) {
      // ID inválido: limpiar y redirigir
      this.onLogout();
      return;
    }

    this.userService.getUserById(numericId).subscribe({
      next: (userData) => {
        this.user = userData;
        this.originalEmail = this.user.email;
        this.originalUserName = this.user.userName; // Capturar nombre inicial
      },
      error: (err) => {
        console.error('Error cargando usuario', err);
        // Si el backend falla (404 / borrado), cerrar sesión y redirigir
        this.onLogout();
      }
    });
  }

  onSavePersonalInfo() {
    if (!this.user) return;

    // Validación teléfono: debe iniciar con '+' seguido de código país y luego dígitos (mínimo +<código><8 dígitos>)
    const phone = this.user.phoneNumber.trim();
    const phoneRegex = /^\+[0-9]{1,3}[0-9]{6,11}$/; // código país 1-3 dígitos + número 6-11 dígitos
    if (!phoneRegex.test(phone)) {
      this.showNotification('PROFILE.PHONE_INVALID');
      return;
    }

    // DNI no editable, se omite validación de longitud para evitar bloqueo si backend maneja distinto.

    this.userService.updateUser(this.user).subscribe({
      next: (response) => {
        this.user = response;
        if (this.user.email !== this.originalEmail) {
          this.showNotification('PROFILE.EMAIL_CHANGED_LOGOUT');
          this.onLogout();
          return;
        }
        if (this.user.userName !== this.originalUserName) {
          this.userEvents.emitUserNameChanged({ oldName: this.originalUserName, newName: this.user.userName });
          this.originalUserName = this.user.userName; // actualizar referencia
        }
        this.showNotification('PROFILE.UPDATE_SUCCESS');
        this.originalEmail = this.user.email;
      },
      error: () => this.showNotification('PROFILE.UPDATE_ERROR')
    });
  }

  onChangePassword() {
    if (!this.user) return;

    if (!this.currentPassword || !this.newPassword || !this.confirmNewPassword) {
      this.showNotification('PROFILE.PASSWORD_FIELDS_INCOMPLETE');
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.showNotification('PROFILE.PASSWORD_MISMATCH');
      return;
    }
    // Llamar endpoint dedicado
    this.userService.changePassword(this.user.id, this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
        this.showNotification('PROFILE.PASSWORD_UPDATE_SUCCESS');
      },
      error: (err) => {
        console.error('Error cambiando contraseña', err);
        this.showNotification('PROFILE.PASSWORD_UPDATE_ERROR');
      }
    });
  }

  onLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/login']);
  }

  onDeleteAccount(): void {
    if (!this.user) return;

    const confirmation = confirm('¿Estás seguro de que deseas eliminar tu cuenta? Tus datos se borrarán y esta acción no se puede deshacer.');

    if (confirmation) {
      this.userService.deleteUser(this.user.id).subscribe({
        next: () => {
          this.showNotification('PROFILE.ACCOUNT_DELETE_SUCCESS');
          this.onLogout();
        },
        error: (err) => {
          console.error('Error eliminando la cuenta:', err);
          this.showNotification('PROFILE.ACCOUNT_DELETE_ERROR');
        }
      });
    }
  }

  toggleCurrent() { this.showCurrentPassword = !this.showCurrentPassword; }
  toggleNew() { this.showNewPassword = !this.showNewPassword; }
  toggleConfirm() { this.showConfirmPassword = !this.showConfirmPassword; }
}
