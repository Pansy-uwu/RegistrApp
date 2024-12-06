import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
    selector: 'app-alumno-dashboard',
    templateUrl: './alumno-dashboard.page.html',
    styleUrls: ['./alumno-dashboard.page.scss'],
    standalone: false
})
export class AlumnoDashboardPage implements OnInit {
  alumnoName: string = ''; // Nombre del alumno
  asignaturas: any[] = []; // Lista de asignaturas
  currentDate: string = ''; // Fecha actual
  currentTime: string = ''; // Hora actual
  userEmail: string = ''; // Correo del usuario
  userUID: string = ''; // UID del usuario en Realtime Database
  horariosDisponibles: { [key: string]: boolean } = {}; // Estado de disponibilidad para escanear QR
  diaActual: string = ''; // Día de la semana actual

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private afAuth: AngularFireAuth
  ) {}

  ngOnInit() {
    this.checkAuthentication(); // Verificar autenticación
    this.setCurrentDate(); // Establecer la fecha actual
    this.setCurrentTime(); // Establecer la hora actual
    this.diaActual = this.obtenerDiaSemana(new Date().getDay()); // Obtener el día actual

    // Actualizar la hora cada minuto
    setInterval(() => {
      this.setCurrentTime();
      this.actualizarHorariosDisponibles(); // Actualizar disponibilidad de escaneo
    }, 60000);
  }

  // Verificar si el usuario está autenticado y obtener UID desde la base de datos
  checkAuthentication() {
    this.afAuth.authState.subscribe((user) => {
      if (user && user.email) {
        this.userEmail = user.email; // Guardar el correo del usuario
        console.log('Usuario autenticado:', this.userEmail);
  
        // Obtener el UID desde la base de datos
        this.firebaseService.getData<{ [key: string]: any }>('usuarios').subscribe({
          next: (usuarios) => {
            if (usuarios) {
              const usuarioEncontrado = Object.entries(usuarios).find(
                ([key, value]: [string, any]) => value.correo === this.userEmail
              );
  
              if (usuarioEncontrado) {
                const [uid, userData] = usuarioEncontrado;
                this.userUID = uid; // Guardar el UID del alumno desde la base de datos
                this.alumnoName = userData.nombre; // Guardar el nombre del alumno
                console.log('UID obtenido desde la base de datos:', this.userUID);
                this.cargarAsignaturas(); // Cargar asignaturas después de obtener el UID
              } else {
                console.error('No se encontró el usuario en la base de datos.');
              }
            } else {
              console.error('No hay datos en la base de datos.');
            }
          },
          error: (error) => {
            console.error('Error al obtener datos de usuarios:', error);
          },
        });
      } else {
        console.log('Usuario no autenticado');
        this.router.navigate(['/login']); // Redirigir al login si no está autenticado
      }
    });
  }
  

  // Establecer la fecha actual
  setCurrentDate() {
    const today = new Date();
    this.currentDate = today.toLocaleDateString(); // Formato: 'dd/mm/yyyy'
  }

  // Establecer la hora actual
  setCurrentTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString(); // Formato: 'HH:mm:ss'
  }

  // Método para cargar asignaturas
  cargarAsignaturas() {
    if (!this.userUID) {
      console.error('No se pudo cargar las asignaturas, UID no encontrado.');
      return;
    }

    console.log('Cargando asignaturas para el alumno con UID:', this.userUID);

    this.firebaseService.getData<{ [key: string]: any }>('asignaturas').subscribe({
      next: (data) => {
        console.log('Datos de asignaturas recibidos:', data);
        if (data) {
          this.asignaturas = Object.entries(data)
            .filter(([key, value]) => value.alumnos && value.alumnos[this.userUID]) // Filtrar asignaturas del alumno
            .map(([key, value]) => ({
              id: key,
              ...value,
            }));

          // Filtrar asignaturas para mostrar solo las que se dictan hoy
          this.asignaturas = this.asignaturas.filter((asignatura) => {
            // Comparar los días de la asignatura con el día actual
            const diasAsignatura = asignatura.dias.map((dia: string) => dia.toLowerCase());
            return diasAsignatura.includes(this.diaActual.toLowerCase());
          });

          console.log('Asignaturas para el día actual:', this.asignaturas);

          // Inicializar estado de horarios disponibles
          this.actualizarHorariosDisponibles();
        } else {
          console.log('No se encontraron asignaturas para este alumno.');
          this.asignaturas = [];
        }
      },
      error: (err) => {
        console.error('Error al cargar asignaturas:', err);
        alert('Hubo un error al cargar las asignaturas.');
      },
    });
  }

  // Actualizar estado de disponibilidad de horarios para escanear QR
  actualizarHorariosDisponibles() {
    const fechaHoy = new Date();
    const horaActual = fechaHoy.getHours() * 60 + fechaHoy.getMinutes(); // Convertir hora actual a minutos desde medianoche

    this.asignaturas.forEach((asignatura) => {
      const horarios = asignatura.horarios[asignatura.tipoClase]; // Obtener horario según tipo de clase (teórica o práctica)

      // Verificar si el día actual está disponible en la asignatura
      const diaDisponible = asignatura.dias
        .map((dia: string) => dia.toLowerCase()) // Convertir los días de la asignatura a minúsculas
        .includes(this.diaActual.toLowerCase()); // Comparar con el día actual

      // Convertir las horas de inicio y fin de la clase a minutos desde medianoche
      const horaInicio = this.convertirAHoraEnMinutos(horarios.horaInicio);
      const horaFin = this.convertirAHoraEnMinutos(horarios.horaFin);

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

  // Obtener el nombre del día según el valor numérico (0-6)
  obtenerDiaSemana(dia: number): string {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return dias[dia].toLowerCase(); // Asegurar que esté en minúsculas
  }

  // Escanear QR de la asignatura
  scanQRCode(asignaturaId: string) {
    if (this.horariosDisponibles[asignaturaId]) {
      console.log('Habilitado para escanear QR en asignatura:', asignaturaId);
      this.router.navigate(['/scan-qr'], {
        queryParams: {
          asignaturaId: asignaturaId,
          userUID: this.userUID,
          userEmail: this.userEmail,
        },
      });
    } else {
      alert('No es el momento adecuado para escanear el QR. Verifique el horario de la clase.');
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
}
