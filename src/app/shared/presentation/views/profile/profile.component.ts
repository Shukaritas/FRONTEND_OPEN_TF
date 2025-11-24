import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import {UserService} from '../../../../plants/profile/services/profile.services';
import {User} from '../../../../plants/profile/domain/model/profile.entity';
import {TranslatePipe} from '@ngx-translate/core';


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
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);

  public user: User = new User();

  public currentPassword = '';
  public newPassword = '';
  public confirmNewPassword = '';

  ngOnInit() {
    this.userService.getUserById(1).subscribe(userData => {
      this.user = userData;
    });
  }

  onSavePersonalInfo() {
    if (!this.user) return;

    if (this.user.phone_number.length !== 9) {
      alert('Phone number must have 9 digits.');
      return;
    }
    if (this.user.identificator.length !== 8) {
      alert('Identity document must have 8 digits.');
      return;
    }

    this.userService.updateUser(this.user).subscribe({
      next: (response) => {
        this.user = response;
        alert('Personal information saved successfully!');
      },
      error: (err) => alert('Could not save personal information.')
    });
  }

  onChangePassword() {
    if (!this.user || !this.user.password) return;

    if (!this.currentPassword || !this.newPassword || !this.confirmNewPassword) {
      alert('Please fill all password fields.');
      return;
    }
    if (this.currentPassword !== this.user.password) {
      alert('Current password is incorrect.');
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      alert('New passwords do not match.');
      return;
    }

    const updatedUser = { ...this.user, password: this.newPassword };

    this.userService.updateUser(updatedUser).subscribe({
      next: (response) => {
        this.user = response;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
        alert('Password changed successfully!');
      },
      error: (err) => alert('Could not change password.')
    });
  }

  onLogout() {
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/login']);
  }
  onDeleteAccount(): void {
    if (!this.user) return;

    const confirmation = confirm('Are you sure you want to delete your account? All your data will be erased and this action cannot be undone.');

    if (confirmation) {
      this.userService.deleteAccountData(this.user.id).subscribe({
        next: () => {
          alert('Account deleted successfully.');
          this.onLogout();
        },
        error: (err) => {
          console.error('Error deleting account:', err);
          alert('There was an error deleting your account.');
        }
      });
    }
  }
}
