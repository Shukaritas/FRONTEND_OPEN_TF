import { Component, inject, PLATFORM_ID } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { SidebarService } from '../../../infrastructure/services/sidebar.service';
import { LanguageSwitcher } from '../language-switcher/language-switcher.component';
import { TranslateModule } from '@ngx-translate/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatIcon, MatIconButton, RouterLink, LanguageSwitcher, TranslateModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  private sidebarService = inject(SidebarService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('isLoggedIn');
      this.router.navigate(['/login']);
    }
  }
}
