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
  asignaturaNombre: string = ''; // Nueva variable para el nombre de la asignatura

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
    const asignaturaPath = `asignaturas/${this.asignaturaId}`;
    const usuariosPath = `usuarios`;
  
    console.log(`Cargando datos desde la ruta: ${asignaturaPath}`);
  
    this.firebaseService.getData<any>(asignaturaPath).subscribe({
      next: (asignatura) => {
        console.log('Datos de la asignatura:', asignatura);
  
        if (asignatura) {
          this.asignaturaNombre = asignatura.nombre || 'Asignatura'; // Guardar el nombre de la asignatura
  
          if (asignatura.alumnos && asignatura.asistencias) {
            const alumnos = Object.keys(asignatura.alumnos); // UIDs de los alumnos registrados
            const asistencias = asignatura.asistencias;
  
            // Obtener los nombres de los usuarios
            this.firebaseService.getData<{ [uid: string]: { nombre: string; apellido: string } } | null>(usuariosPath).subscribe({
              next: (usuarios) => {
                console.log('Datos de los usuarios:', usuarios);
  
                if (usuarios) {
                  // Procesar cada clase en las asistencias
                  this.historial = Object.entries(asistencias).map(([claseId, registros]) => {
                    const estudiantes: Estudiante[] = alumnos.map((uid) => {
                      const asistencia = (registros as { [uid: string]: { nombre: string; estado: string; fecha: string; timestamp: string } })[uid];
                      const nombreCompleto = usuarios[uid] ? `${usuarios[uid].nombre} ${usuarios[uid].apellido}` : 'Desconocido';
  
                      return {
                        uid,
                        nombre: asistencia?.nombre || nombreCompleto, // Priorizar el nombre de la asistencia, luego usar el de usuarios
                        estado: asistencia ? asistencia.estado : 'Ausente', // Si no hay registro, marcar como "Ausente"
                        timestamp: asistencia?.timestamp || '',
                      };
                    });
  
                    return {
                      id: claseId, // Ejemplo: "Clase 1"
                      fecha: this.formatFecha(Object.values(registros as object)[0]?.fecha || ''), // Fecha de la clase
                      estudiantes,
                      visible: false, // El menú está inicialmente cerrado
                    };
                  });
  
                  console.log('Historial procesado:', this.historial);
                } else {
                  this.mensajeError = 'No se encontraron datos de usuarios.';
                  console.warn(this.mensajeError);
                }
              },
              error: (err) => {
                this.mensajeError = 'Error al cargar los datos de los usuarios.';
                console.error(this.mensajeError, err);
              },
            });
          } else {
            this.mensajeError = 'No se encontraron registros de alumnos o asistencias para esta asignatura.';
            console.warn(this.mensajeError);
          }
        } else {
          this.mensajeError = 'La asignatura no existe.';
          console.warn(this.mensajeError);
        }
      },
      error: (err) => {
        this.mensajeError = 'Ocurrió un error al cargar los datos de la asignatura.';
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
