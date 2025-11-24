import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const authGuard = () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformBrowser(platformId)) {
    const hasToken = !!localStorage.getItem('authToken');
    const isLoggedInFlag = localStorage.getItem('isLoggedIn') === 'true';
    const isLoggedIn = hasToken || isLoggedInFlag;
    console.log('AuthGuard check. hasToken:', hasToken, 'isLoggedInFlag:', isLoggedInFlag); // Debug

    if (!isLoggedIn) {
      console.log('AuthGuard: Bloqueando acceso -> Login');
      router.navigate(['/login']);
      return false;
    }
  }
  return true;
};
