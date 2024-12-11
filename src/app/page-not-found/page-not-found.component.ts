import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss'],
})
export class PageNotFoundComponent {
  constructor(
    private location: Location,
    private router: Router,
    private authService: AuthService
  ) {}

  async goBack(): Promise<void> {
    const currentHistory = window.history.length;
  
    if (currentHistory > 1) {
      this.location.back(); // Si hay historial, regresa
    } else {
      const user = await this.authService.getUsuarioActual();
      if (user) {
        if (user.role === 'alumno') {
          this.router.navigate(['/alumno-dashboard']);
        } else if (user.role === 'profesor') {
          this.router.navigate(['/profesor-dashboard']);
        } else {
          this.router.navigate(['/login']); // Por defecto, redirige al login
        }
      } else {
        this.router.navigate(['/login']); // Usuario no autenticado, redirige al login
      }
    }
  }
  
}
