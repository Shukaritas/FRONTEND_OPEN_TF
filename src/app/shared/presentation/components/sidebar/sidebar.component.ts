import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SidebarService } from '../../../infrastructure/services/sidebar.service';
import { NgClass } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass, MatIcon, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private sidebarService = inject(SidebarService);

  isCollapsed = this.sidebarService.isCollapsed;
  isMobile = this.sidebarService.isMobile;

  menuItems = [
    { label: 'SIDEBAR.DASHBOARD', route: '/dashboard', icon: 'dashboard' },
    { label: 'SIDEBAR.MY_CROPS', route: '/my-crops', icon: 'grass' },
    { label: 'SIDEBAR.MY_FIELDS', route: '/my-fields', icon: 'agriculture' },
    { label: 'SIDEBAR.MY_TASKS', route: '/my-tasks', icon: 'task_alt' },
    { label: 'SIDEBAR.COMMUNITY', route: '/community', icon: 'groups' }
  ];
}
