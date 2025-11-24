import {inject, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {Router} from '@angular/router';

export const loginGuard = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    console.log('LoginGuard check. LoggedIn:', isLoggedIn); // Debug

    if (isLoggedIn) {
      console.log('LoginGuard: Usuario ya logueado -> Dashboard');
      // IMPORTANTE: Verifica que no estás en dashboard para evitar recargas
      if (router.url !== '/dashboard') {
        router.navigate(['/dashboard']);
      }
      return false;
    }
  }
  return true;
};
