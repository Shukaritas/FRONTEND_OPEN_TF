import {inject, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';
import {Router} from '@angular/router';

export const loginGuard = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    const hasToken = !!localStorage.getItem('authToken');
    const isLoggedInFlag = localStorage.getItem('isLoggedIn') === 'true';
    const isLoggedIn = hasToken || isLoggedInFlag;
    console.log('LoginGuard check. hasToken:', hasToken, 'isLoggedInFlag:', isLoggedInFlag); // Debug

    if (isLoggedIn) {
      console.log('LoginGuard: Usuario ya logueado -> Dashboard');
      if (router.url !== '/dashboard') {
        router.navigate(['/dashboard']);
      }
      return false;
    }
  }
  return true;
};
