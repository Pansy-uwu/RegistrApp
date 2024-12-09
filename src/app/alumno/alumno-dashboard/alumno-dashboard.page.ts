import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-alumno-dashboard',
  templateUrl: './alumno-dashboard.page.html',
  styleUrls: ['./alumno-dashboard.page.scss'],
})
export class AlumnoDashboardPage implements OnInit {
  alumnoName: string = ''; // Nombre del alumno
  userRole: string = ''; // Rol del usuario
  asignaturas: any[] = []; // Lista de asignaturas
  asignaturaHoy: any = null; // Asignatura del día actual
  currentDate: string = ''; // Fecha actual
  currentTime: string = ''; // Hora actual
  userEmail: string = ''; // Correo del usuario
  userUID: string = ''; // UID del usuario en Realtime Database
  diaActual: string = ''; // Día de la semana actual
  asignaturasDelDia: any[] = []; // Lista de asignaturas correspondientes al día actual
  horariosDisponibles: { [key: string]: boolean } = {}; // Disponibilidad de horarios para escanear QR

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit() {
    this.checkAuthentication(); // Verificar autenticación y cargar datos
    this.setCurrentDate(); // Establecer la fecha actual
    this.setCurrentTime(); // Establecer la hora actual
    this.diaActual = this.obtenerDiaSemana(new Date().getDay()); // Obtener el día actual

    // Actualizar la hora cada minuto
    setInterval(() => {
      this.setCurrentTime();
      this.actualizarHorariosDisponibles(); // Actualizar disponibilidad de horarios cada minuto
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
                this.userUID = uid;
                this.alumnoName = userData.nombre;
                this.userRole = userData.role;
                this.cargarAsignaturas(uid); // Cargar asignaturas después de obtener datos
              }
            }
          },
        });
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  // Establecer la fecha actual
  setCurrentDate() {
    const today = new Date();
    this.currentDate = today.toLocaleDateString(); // Formato: dd/mm/yyyy
  }

  // Establecer la hora actual
  setCurrentTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString(); // Formato: HH:mm:ss
  }

  cargarAsignaturas(uid: string) {
    this.firebaseService.getData<{ [key: string]: any }>('asignaturas').subscribe({
      next: (data) => {
        if (data) {
          // Filtrar asignaturas asociadas al usuario
          const asignaturas = Object.entries(data)
            .filter(([key, value]) => value.alumnos && value.alumnos[uid])
            .map(([key, value]) => ({
              id: key,
              ...value,
            }));

          this.asignaturas = asignaturas;

          // Normalizar días y filtrar asignaturas correspondientes al día actual
          this.asignaturasDelDia = asignaturas.filter((asignatura) => {
            const diasAsignatura = asignatura.dias.map((dia: string) => dia.trim().toLowerCase());
            return diasAsignatura.includes(this.diaActual.toLowerCase());
          });

          this.actualizarHorariosDisponibles(); // Actualizar disponibilidad de horarios al cargar asignaturas

        } else {
          this.asignaturas = [];
          this.asignaturasDelDia = [];
        }
      },
      error: (err) => {
        console.error('Error al cargar asignaturas:', err);
      },
    });
  }

  obtenerDiaSemana(dia: number): string {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return dias[dia].toLowerCase(); // Convertir el día a minúsculas
  }

  // Escanear QR
  scanQRCode(asignaturaId: string) {
    if (this.horariosDisponibles[asignaturaId]) {
      this.router.navigate(['/scan-qr'], {
        queryParams: {
          asignaturaId: asignaturaId,
          userUID: this.userUID,
          userEmail: this.userEmail,
        },
      });
    } else {
      alert('No es el momento adecuado para escanear el QR.');
    }
  }

  // Ver historial de asistencia
  verHistorial(asignaturaId: string) {
    this.router.navigate(['/historial-asistencia-alumno'], {
      queryParams: { asignaturaId: asignaturaId },
    });
  }

  // Cerrar sesión
  logout() {
    this.afAuth.signOut().then(() => {
      this.router.navigate(['/login']);
    });
  }

  // Actualizar estado de disponibilidad de horarios para escanear QR
// Actualizar estado de disponibilidad de horarios para escanear QR
actualizarHorariosDisponibles() {
  const fechaHoy = new Date();
  const horaActual = fechaHoy.getHours() * 60 + fechaHoy.getMinutes(); // Convertir hora actual a minutos desde medianoche

  this.asignaturas.forEach((asignatura) => {
    // Verificar si el tipo de clase está definido y si la asignatura tiene horarios para el tipo de clase
    const horarios = asignatura.horarios?.[asignatura.tipoClase]; 

    // Validar si los horarios existen antes de proceder
    if (!horarios) {
      console.warn(`La asignatura con ID ${asignatura.id} no tiene horarios definidos para el tipo de clase: ${asignatura.tipoClase}`);
      this.horariosDisponibles[asignatura.id] = false;
      return; // Saltar a la siguiente asignatura
    }

    // Verificar si el día actual está disponible en la asignatura
    const diaDisponible = asignatura.dias
      ?.map((dia: string) => dia.toLowerCase()) // Convertir los días de la asignatura a minúsculas
      .includes(this.diaActual.toLowerCase()); // Comparar con el día actual

    if (!diaDisponible) {
      console.warn(`El día de hoy (${this.diaActual}) no está disponible para la asignatura con ID ${asignatura.id}`);
      this.horariosDisponibles[asignatura.id] = false;
      return; // Saltar a la siguiente asignatura
    }

    // Convertir las horas de inicio y fin de la clase a minutos desde medianoche
    const horaInicio = horarios.horaInicio ? this.convertirAHoraEnMinutos(horarios.horaInicio) : null;
    const horaFin = horarios.horaFin ? this.convertirAHoraEnMinutos(horarios.horaFin) : null;

    if (horaInicio === null || horaFin === null) {
      console.warn(`La asignatura con ID ${asignatura.id} tiene horas de inicio o fin no definidas`);
      this.horariosDisponibles[asignatura.id] = false;
      return; // Saltar a la siguiente asignatura
    }

    // Verificar si la hora actual está dentro del rango de horarios de la asignatura
    const estaDentroDelHorario = horaActual >= horaInicio && horaActual <= horaFin;

    // Habilitar escaneo si está dentro del horario y día disponible
    this.horariosDisponibles[asignatura.id] = diaDisponible && estaDentroDelHorario;
  });
}

  // Convertir una hora en formato HH:mm a minutos desde medianoche
  convertirAHoraEnMinutos(hora: string): number {
    const [hh, mm] = hora.split(':').map(Number); // Convertir "HH:mm" a [HH, mm]
    return hh * 60 + mm; // Convertir a minutos
  }
}
