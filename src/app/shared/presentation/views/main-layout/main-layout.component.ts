import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarService } from '../../../infrastructure/services/sidebar.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent, NgClass],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private sidebarService = inject(SidebarService);
  private breakpointObserver = inject(BreakpointObserver);
  private destroy$ = new Subject<void>();

  isCollapsed = this.sidebarService.isCollapsed;
  isMobile = this.sidebarService.isMobile;

  ngOnInit() {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        const isMobile = result.matches;
        this.sidebarService.setMobileMode(isMobile);
        if (isMobile) {
          this.sidebarService.closeSidebar();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  closeSidebar() {
    this.sidebarService.closeSidebar();
  }
}
