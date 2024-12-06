import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  async onSubmit() {
    console.log('Inicio de sesión iniciado...');
    console.log('Email ingresado:', this.email);
    console.log('Contraseña ingresada:', this.password);
    
    try {
      const userData = await this.authService.login(this.email, this.password);
      console.log('Datos obtenidos del usuario:', userData);
  
      if (userData && userData.role) {
        console.log('Rol del usuario:', userData.role);
        if (userData.role === 'profesor') {
          this.router.navigate(['/profesor-dashboard']);
        } else if (userData.role === 'alumno') {
          this.router.navigate(['/alumno-dashboard']);
        } else {
          alert('Rol no definido. Verifica los datos del usuario.');
        }
      } else {
        alert('No se pudo obtener el rol del usuario.');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      alert('Error al iniciar sesión: ' + (error instanceof Error ? error.message : 'Error desconocido.'));
    }
  }

  async recoverPassword() {
    if (!this.email) {
      alert('Por favor, ingresa tu correo electrónico para recuperar la contraseña.');
      return;
    }

    try {
      await this.authService.sendPasswordResetEmail(this.email);
      alert('Correo de recuperación enviado. Revisa tu bandeja de entrada.');
      console.log('Correo de recuperación enviado al email:', this.email);
    } catch (error) {
      console.error('Error al enviar correo de recuperación:', error);
      alert('Error al enviar correo de recuperación: ' + (error instanceof Error ? error.message : 'Error desconocido.'));
    }
  }
}