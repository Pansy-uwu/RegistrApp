import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
    selector: 'app-historial-asistencia-alumno',
    templateUrl: './historial-asistencia-alumno.page.html',
    styleUrls: ['./historial-asistencia-alumno.page.scss'],
    standalone: false
})
export class HistorialAsistenciaAlumnoPage implements OnInit {
  asignaturaId: string = ''; // ID de la asignatura
  historial: any[] = []; // Historial de asistencia
  userEmail: string = ''; // Correo del usuario autenticado
  userUID: string = ''; // UID del usuario en Firebase
  mensajeError: string = ''; // Mensaje en caso de error

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private firebaseService: FirebaseService,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit() {
    console.log('Iniciando HistorialAsistenciaAlumnoPage...');
    this.route.queryParams.subscribe((params) => {
      if (params && params['asignaturaId']) {
        this.asignaturaId = params['asignaturaId'];
        console.log('Asignatura ID recibido:', this.asignaturaId);
        this.checkAuthentication();
      } else {
        console.error('No se proporcionó asignaturaId');
        this.router.navigate(['/alumno-dashboard']);
      }
    });
  }

  checkAuthentication() {
    this.afAuth.authState.subscribe((user) => {
      if (user && user.email) {
        this.userEmail = user.email;
        console.log('Correo autenticado:', this.userEmail);
        this.getAlumnoUID();
      } else {
        console.error('No se encontró el usuario autenticado');
        this.router.navigate(['/login']);
      }
    });
  }

  getAlumnoUID() {
    this.firebaseService.getData<{ [key: string]: any }>('usuarios').subscribe({
      next: (data) => {
        console.log('Datos del nodo usuarios desde Firebase:', data);

        if (data) {
          const usuario = Object.entries(data).find(([key, value]: any) => value.correo === this.userEmail);
          if (usuario) {
            const [uid] = usuario;
            console.log('UID encontrado:', uid);
            this.userUID = uid;
            this.loadHistorial();
          } else {
            console.error('Usuario no encontrado en Firebase con el correo:', this.userEmail);
            this.mensajeError = 'No se encontró el usuario en el sistema.';
          }
        } else {
          console.error('No se encontraron datos en el nodo usuarios');
          this.mensajeError = 'No se encontraron datos de usuarios.';
        }
      },
      error: (err) => {
        console.error('Error al obtener usuarios desde Firebase:', err);
        this.mensajeError = 'Hubo un error al cargar los datos del usuario.';
      },
    });
  }

  loadHistorial() {
    const asistenciaPath = `asignaturas/${this.asignaturaId}/asistencias`;
    console.log('Cargando historial desde la ruta:', asistenciaPath);
  
    this.firebaseService.getData<{ [claseId: string]: { [uid: string]: { fecha: string; nombre: string; estado: string; timestamp: string } } }>(asistenciaPath).subscribe({
      next: (data) => {
        console.log('Datos completos desde Firebase:', data);
  
        if (data) {
          let contador = 1; // Para numerar las clases
          this.historial = Object.entries(data).map(([claseId, estudiantes]) => {
            // Obtenemos la fecha de la primera entrada de la clase
            const primerEstudiante = Object.values(estudiantes)[0];
            const fechaOriginal = primerEstudiante ? primerEstudiante.fecha : null;
            const fechaFormateada = fechaOriginal ? this.formatFecha(fechaOriginal) : 'Fecha no disponible';
  
            // Verificamos si el estudiante está registrado
            const estudiante = estudiantes[this.userUID];
            const estado = estudiante ? estudiante.estado : 'Ausente';
  
            return {
              clase: `Clase ${contador++} - ${fechaFormateada}`, // Clase + Número y Fecha
              estado,
            };
          });
  
          console.log('Historial procesado:', this.historial);
        } else {
          console.log('No se encontraron asistencias para esta asignatura');
          this.historial = [{ clase: 'Sin registros', estado: 'Ausente' }];
        }
      },
      error: (err) => {
        console.error('Error al cargar historial desde Firebase:', err);
        this.mensajeError = 'Hubo un error al cargar el historial de asistencias.';
      },
    });
  }
  
  formatFecha(fecha: string): string {
    if (!fecha) {
      return '';
    }
    const [year, month, day] = fecha.split('-'); // Dividimos la fecha en partes
    return `${day}-${month}-${year}`; // Reorganizamos en formato DD-MM-YYYY
  }
  
  
}
