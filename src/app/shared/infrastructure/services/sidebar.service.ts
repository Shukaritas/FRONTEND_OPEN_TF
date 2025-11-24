import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  isCollapsed = signal(false);
  isMobile = signal(false);

  toggleSidebar() {
    this.isCollapsed.update(value => !value);
  }

  setMobileMode(isMobile: boolean) {
    this.isMobile.set(isMobile);
  }

  closeSidebar() {
    this.isCollapsed.set(true);
  }

  openSidebar() {
    this.isCollapsed.set(false);
  }
}
