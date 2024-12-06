import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    console.log('Verificando autenticación en guard...');
    const isAuthenticated = await authService.checkAuthStatus();  // Verifica si el usuario está autenticado
    console.log('Estado de autenticación en guard:', isAuthenticated);

    // Si no está autenticado, redirige a login
    if (!isAuthenticated) {
      console.log('Usuario no autenticado, redirigiendo a login...');
      router.navigate(['/login']);
      return false;
    }

    // Si está autenticado, permite el acceso
    console.log('Usuario autenticado, accediendo a la ruta...');
    return true;
  } catch (error) {
    console.error('Error en el guard al verificar autenticación:', error);
    router.navigate(['/login']);
    return false;
  }
};
