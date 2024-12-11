import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-profesor-dashboard',
  templateUrl: './profesor-dashboard.page.html',
  styleUrls: ['./profesor-dashboard.page.scss'],
})
export class ProfesorDashboardPage implements OnInit {
  userEmail: string = '';
  profesorName: string = '';
  userUID: string = '';
  userRole: string = '';
  asignaturas: any[] = [];
  asignaturasDelDia: any[] = [];
  diaActual: string = '';
  currentDate: string = ''; 
  currentTime: string = ''; 
  horariosDisponibles: { [key: string]: boolean } = {}; 
  asignaturaId: string = '';

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private afAuth: AngularFireAuth
  ) {}

  async ngOnInit() {
    this.checkAuthentication();
    this.setCurrentDate();
    this.setCurrentTime();
    this.diaActual = this.obtenerDiaSemana(new Date().getDay());

    setInterval(() => {
      this.setCurrentTime();
      this.actualizarHorariosDisponibles();
    }, 60000);
  }

  // Verificar autenticación y cargar datos del usuario
  checkAuthentication() {
    this.afAuth.authState.subscribe((user) => {
      if (user && user.email) {
        this.userEmail = user.email;

        // Obtener datos del usuario desde Firebase
        this.firebaseService.getData<{ [key: string]: any }>('usuarios').subscribe({
          next: (usuarios) => {
            if (usuarios) {
              const usuarioEncontrado = Object.entries(usuarios).find(
                ([key, value]) => value.correo === this.userEmail
              );

              if (usuarioEncontrado) {
                const [uid, userData] = usuarioEncontrado;
                this.userUID = uid; // Guardar UID del profesor
                this.profesorName = userData.nombre;
                this.userRole = userData.role;
                this.cargarAsignaturas(uid); // Cargar asignaturas relacionadas con este profesor
              }
            }
          },
          error: (err) => {
            console.error('Error al obtener los usuarios:', err);
          }
        });
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  // Cargar asignaturas del profesor
  cargarAsignaturas(uid: string) {
    this.firebaseService.getData<{ [key: string]: any }>('asignaturas').subscribe({
      next: (data) => {
        if (data) {
          this.asignaturas = Object.entries(data)
            .filter(([id, value]) => value.profesor === uid)
            .map(([id, value]) => {
              return {
                id,
                nombre: value.nombre || 'Sin Nombre',
                seccion: value.seccion || 'N/A',
                tipoClase: value.tipoClase || 'Desconocida',
                diasTeoricos:
                  value.tipoClase === 'teorica' || value.tipoClase === 'mixta'
                    ? Array.isArray(value.dias)
                      ? value.dias
                      : value.dias?.teorica || []
                    : [],
                diasPracticos:
                  value.tipoClase === 'practica' || value.tipoClase === 'mixta'
                    ? Array.isArray(value.dias)
                      ? value.dias
                      : value.dias?.practica || []
                    : [],
                horarioTeorico:
                  value.tipoClase === 'teorica' || value.tipoClase === 'mixta'
                    ? value.horarios?.teorica || { horaInicio: 'N/A', horaFin: 'N/A' }
                    : { horaInicio: 'N/A', horaFin: 'N/A' },
                horarioPractico:
                  value.tipoClase === 'practica' || value.tipoClase === 'mixta'
                    ? value.horarios?.practica || { horaInicio: 'N/A', horaFin: 'N/A' }
                    : { horaInicio: 'N/A', horaFin: 'N/A' },
              };
            });
  
          this.filtrarAsignaturasDelDia();
          this.actualizarHorariosDisponibles();
        } else {
          this.asignaturas = [];
        }
      },
      error: (err) => {
        console.error('Error al cargar asignaturas:', err);
      },
    });
  }
  
  // Establecer la fecha actual
  setCurrentDate() {
    const today = new Date();
    this.currentDate = today.toLocaleDateString();
  }

  // Establecer la hora actual
  setCurrentTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString();
  }

  obtenerDiaSemana(dia: number): string {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return dias[dia].toLowerCase();
  }

  filtrarAsignaturasDelDia() {
    const diaActual = this.obtenerDiaSemana(new Date().getDay()); // Obtiene el día actual en texto (e.g., "lunes").
  
    this.asignaturasDelDia = this.asignaturas.filter((asignatura) => {
      const esDiaTeorico = asignatura.diasTeoricos?.some(
        (dia: string) => dia.trim().toLowerCase() === diaActual
      );
      const esDiaPractico = asignatura.diasPracticos?.some(
        (dia: string) => dia.trim().toLowerCase() === diaActual
      );
  
      // Determinar el tipo de clase y horario correspondiente al día actual.
      if (esDiaTeorico && asignatura.horarioTeorico) {
        asignatura.tipoClaseHoy = 'Teórica';
        asignatura.horarioHoy = asignatura.horarioTeorico;
      } else if (esDiaPractico && asignatura.horarioPractico) {
        asignatura.tipoClaseHoy = 'Práctica';
        asignatura.horarioHoy = asignatura.horarioPractico;
      }
  
      // Incluir asignatura si coincide con días teóricos o prácticos.
      return esDiaTeorico || esDiaPractico;
    });
  
    console.log('Asignaturas del día:', this.asignaturasDelDia);
  }
  
  
  
  actualizarHorariosDisponibles() {
    const horaActualEnMinutos = new Date().getHours() * 60 + new Date().getMinutes();

    this.asignaturas.forEach(asignatura => {
      const horario = asignatura.horarioHoy;
      if (!horario || horario.horaInicio === 'N/A' || horario.horaFin === 'N/A') {
        this.horariosDisponibles[asignatura.id] = false;
        return;
      }

      const horaInicio = this.convertirAHoraEnMinutos(horario.horaInicio);
      const horaFin = this.convertirAHoraEnMinutos(horario.horaFin);
      const estaDisponible = horaActualEnMinutos >= horaInicio && horaActualEnMinutos <= horaFin;

      this.horariosDisponibles[asignatura.id] = estaDisponible;
      console.log(
        `Asignatura: ${asignatura.nombre}, HoraActual: ${horaActualEnMinutos}, HoraInicio: ${horaInicio}, HoraFin: ${horaFin}, Disponible: ${estaDisponible}`
      );
    });

    console.log('Horarios disponibles actualizados:', this.horariosDisponibles);
  }

  convertirAHoraEnMinutos(hora: string): number {
    const [hh, mm] = hora.split(':').map(Number);
    return hh * 60 + mm;
  }

  irACrearAsignatura(profesorUID: string) {
    console.log(`Navegando a la creación de asignatura con ID de profesor: ${profesorUID}`);
    this.router.navigate(['/crear-asignatura'], {
      queryParams: { profesorUID: profesorUID },
    });
  }
  

  irAGenerarQR(asignaturaId: string) {
    console.log(`Navegando a la generación de QR con ID de asignatura: ${asignaturaId}`);
    this.router.navigate(['/generate-qr'], {
      queryParams: { id: asignaturaId }, // Cambiar clave a 'id'
    });
  }
  

  // Ver historial de asistencia
  verHistorial(asignaturaId: string) {
    this.router.navigate(['/historial-asistencia-profesor'], {
      queryParams: { id: asignaturaId },
    });
  }

  modificarAsignatura(asignaturaId: string) {
    this.router.navigate(['/modificar-asignatura', asignaturaId]);
  }

  eliminarAsignatura(asignaturaId: string) {
    this.firebaseService.deleteData(`asignaturas/${asignaturaId}`).then(() => {
      console.log('Asignatura eliminada correctamente');
    }).catch((error) => {
      console.error('Error al eliminar asignatura:', error);
    });
  }
  confirmarEliminacion(asignaturaId: string) {
    const confirmar = window.confirm('¿Estás seguro de que deseas eliminar esta asignatura? Esta acción no se puede deshacer.');
    if (confirmar) {
      this.eliminarAsignatura(asignaturaId);
    }
  }
  
  logout() {
    this.afAuth.signOut().then(() => {
      this.router.navigate(['/login']);
    }).catch((error) => {
      console.error('Error al cerrar sesión:', error);
    });
  }
}
