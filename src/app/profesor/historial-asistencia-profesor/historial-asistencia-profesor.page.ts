import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';

interface Estudiante {
  uid: string;
  nombre: string;
  estado: string;
  timestamp?: string;
}

interface Clase {
  id: string; // Clase 1, Clase 2, etc.
  fecha: string;
  estudiantes: Estudiante[];
  visible: boolean; // Para manejar el menú desplegable
}

@Component({
    selector: 'app-historial-asistencia-profesor',
    templateUrl: './historial-asistencia-profesor.page.html',
    styleUrls: ['./historial-asistencia-profesor.page.scss'],
    standalone: false
})
export class HistorialAsistenciaProfesorPage implements OnInit {
  asignaturaId!: string;
  historial: Clase[] = [];
  mensajeError: string = '';

  constructor(private route: ActivatedRoute, private firebaseService: FirebaseService) {}

  ngOnInit() {
    console.log('Iniciando HistorialAsistenciaProfesorPage...');
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.asignaturaId = params['id'];
        console.log('ID de la asignatura recibido:', this.asignaturaId);
        this.cargarHistorial();
      } else {
        this.mensajeError = 'No se recibió el ID de la asignatura.';
        console.error(this.mensajeError);
      }
    });
  }

  cargarHistorial() {
    const historialPath = `asignaturas/${this.asignaturaId}/asistencias`;
    console.log(`Cargando historial desde la ruta: ${historialPath}`);
  
    this.firebaseService
      .getData<{ [claseId: string]: { [uid: string]: { nombre: string; estado: string; fecha: string; timestamp: string } } }>(historialPath)
      .subscribe({
        next: (data) => {
          console.log('Datos recibidos del historial:', data);
  
          if (data) {
            this.historial = Object.entries(data).map(([claseId, estudiantes]) => ({
              id: claseId, // Ejemplo: "Clase 1"
              fecha: this.formatFecha(Object.values(estudiantes)[0]?.fecha || ''), // Formatear la fecha
              estudiantes: Object.entries(estudiantes).map(([uid, estudiante]) => ({
                uid, // Se toma directamente de la clave
                nombre: estudiante.nombre,
                estado: estudiante.estado,
                timestamp: estudiante.timestamp,
              })),
              visible: false, // El menú está inicialmente cerrado
            }));
  
            console.log('Historial procesado:', this.historial);
          } else {
            this.mensajeError = 'No se encontraron registros de asistencia para esta asignatura.';
            console.warn(this.mensajeError);
          }
        },
        error: (err) => {
          this.mensajeError = 'Ocurrió un error al cargar el historial de asistencia.';
          console.error(this.mensajeError, err);
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

  toggleMenu(clase: Clase) {
    clase.visible = !clase.visible;
  }
}
