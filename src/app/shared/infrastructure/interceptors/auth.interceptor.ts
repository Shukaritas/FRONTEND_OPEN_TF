import { HttpInterceptorFn } from '@angular/common/http';

// Interceptor funcional para añadir el header Authorization si existe el token en localStorage
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Evitar errores en SSR comprobando entorno
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token'); // Clave indicada por el usuario
    if (token) {
      token = token.trim();
    }
  }

  if (token && token.length > 0) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }
  return next(req);
};

