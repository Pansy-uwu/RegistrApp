import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase
  ) {}

  async login(email: string, password: string): Promise<any> {
    console.log('Iniciando sesión con Firebase Authentication...');
    try {
      // Autenticar al usuario
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
  
      if (user) {
        console.log('Usuario autenticado:', user);
  
        // Obtener datos desde Realtime Database
        const snapshot = await this.db.database.ref('/usuarios').once('value');
        const rawData = snapshot.val(); // Datos brutos obtenidos
        console.log('Datos brutos obtenidos:', rawData);
  
        // Convertir el objeto en un arreglo
        const allUsers = rawData
          ? Object.keys(rawData).map((key) => ({ uid: key, ...rawData[key] }))
          : [];
        console.log('Usuarios procesados:', allUsers);
  
        // Buscar el usuario por correo
        const userData = allUsers.find((u: any) => u.correo === email);
        if (userData) {
          console.log('Datos adicionales del usuario:', userData);
          return { ...user, ...userData }; // Combinar datos del usuario autenticado y los datos adicionales
        } else {
          console.warn('No se encontraron datos adicionales para el correo:', email);
          throw new Error('No se encontraron datos adicionales del usuario en Realtime Database.');
        }
      } else {
        throw new Error('Usuario no encontrado.');
      }
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await this.afAuth.sendPasswordResetEmail(email);
    } catch (error) {
      throw error;
    }
  }

  // Método para obtener el correo electrónico del usuario autenticado
  async getUserEmail(): Promise<string | null> {
    const user = await this.afAuth.currentUser;  // Obtiene el usuario actualmente autenticado
    return user ? user.email : null;  // Si el usuario está autenticado, devuelve su email
  }

  // Método para obtener el usuario actual
  async getUsuarioActual(): Promise<any> {
    try {
      const user = await this.afAuth.currentUser;
      if (user && user.email) {
        const snapshot = await this.db.database.ref('/usuarios').once('value');
        const rawData = snapshot.val();
        const allUsers = rawData
          ? Object.keys(rawData).map((key) => ({ uid: key, ...rawData[key] }))
          : [];

        const usuario = allUsers.find((u) => u.correo === user.email);
        return usuario ? { ...user, ...usuario } : null;
      }
      return null;
    } catch (error) {
      console.error('Error al obtener el usuario:', error);
      return null;
    }
  }

  // Método de verificación de estado de autenticación
  async checkAuthStatus(): Promise<boolean> {
    try {
      console.log('Verificando estado de autenticación...');
      const user = await this.afAuth.currentUser; // Firebase nos da el usuario actual
      console.log('Usuario autenticado:', user);
      return user !== null; // Retorna true si el usuario está autenticado
    } catch (error) {
      console.error('Error al verificar estado de autenticación:', error);
      return false; // Si hay un error, consideramos que no está autenticado
    }
  }
}