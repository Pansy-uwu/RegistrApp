import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../../services/firebase.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-profesor-dashboard',
    templateUrl: './profesor-dashboard.page.html',
    styleUrls: ['./profesor-dashboard.page.scss'],
})
export class ProfesorDashboardPage implements OnInit {
  asignaturas: any[] = [];
  mensaje: string = '';
  profesorUID: string = ''; // UID del profesor desde la base de datos
  isQRGenerated: { [key: string]: boolean } = {}; // Estado de generación de QR por asignatura
  horariosDisponibles: { [key: string]: boolean } = {}; // Estado de disponibilidad de la generación de QR según el horario
  diaActual: string = ''; // Día de la semana actual

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('Iniciando ProfesorDashboardPage...');
    this.obtenerProfesorUID();
    this.diaActual = this.obtenerDiaSemana(new Date().getDay()); // Obtener el día actual
  }

  async obtenerProfesorUID() {
    try {
      const usuarioActual = await this.authService.getUsuarioActual();
      console.log('Usuario autenticado con datos adicionales:', usuarioActual);

      if (usuarioActual && usuarioActual.uid) {
        this.profesorUID = usuarioActual.uid; // UID del profesor desde la base de datos
        console.log('UID del profesor encontrado:', this.profesorUID);
        this.cargarAsignaturas(); // Cargar asignaturas después de obtener el UID
      } else {
        console.error('No se encontró el UID del profesor. Asegúrese de haber iniciado sesión.');
        alert('No se encontró el UID del profesor. Asegúrese de haber iniciado sesión.');
      }
    } catch (error) {
      console.error('Error al obtener el UID del profesor:', error);
      alert('Hubo un error al obtener los datos del usuario.');
    }
  }

  irACrearAsignatura() {
    if (!this.profesorUID) {
      alert('No se encontró el UID del profesor. Asegúrese de haber iniciado sesión.');
      console.error('No se encontró el UID del profesor al intentar crear una asignatura.');
      return;
    }

    console.log('Navegando a Crear Asignatura con UID del profesor:', this.profesorUID);

    // Redirigir a la página de creación de asignaturas con el UID del profesor
    this.router.navigate(['/crear-asignatura'], {
      queryParams: { profesorUID: this.profesorUID },
    });
  }

  cargarAsignaturas() {
    if (!this.profesorUID) {
      console.error('No se puede cargar asignaturas porque el UID del profesor no está definido.');
      return;
    }

    console.log('Cargando asignaturas para el profesor con UID:', this.profesorUID);

    this.firebaseService.getData<{ [key: string]: any }>('asignaturas').subscribe({
      next: (data) => {
        console.log('Datos recibidos de Firebase:', data);

        if (data) {
          // Filtrar asignaturas por el UID del profesor
          this.asignaturas = Object.entries(data)
            .filter(([key, value]: any) => value.profesor === this.profesorUID)
            .map(([key, value]: any) => ({
              id: key,
              ...value,
            }));

          // Filtrar asignaturas para mostrar solo las que se dictan hoy
          this.asignaturas = this.asignaturas.filter((asignatura) =>
            asignatura.dias.some((dia: string) => dia.toLowerCase() === this.diaActual) // Normaliza los días a minúsculas antes de comparar
          );
          
          console.log('Asignaturas filtradas para el día actual:', this.asignaturas);

          // Inicializar estado de QR y horarios disponibles
          this.inicializarEstadoQR();
          this.inicializarHorariosDisponibles();
        } else {
          console.log('No se encontraron asignaturas en Firebase.');
          this.asignaturas = [];
        }
      },
      error: (err) => {
        console.error('Error al cargar asignaturas:', err);
        alert('Hubo un error al cargar las asignaturas.');
      },
    });
  }

  inicializarEstadoQR() {
    const fechaHoy = new Date().toISOString().split('T')[0];
    this.asignaturas.forEach((asignatura) => {
      const asistenciaPath = `asignaturas/${asignatura.id}/asistencias/${fechaHoy}`;
      this.firebaseService.getData<any>(asistenciaPath).subscribe((data) => {
        this.isQRGenerated[asignatura.id] = !!data && Object.keys(data).length > 0;
      });
    });
  }

// Nueva lógica para habilitar o deshabilitar generación de QR según día y hora
inicializarHorariosDisponibles() {
  const fechaHoy = new Date();
  const horaActual = fechaHoy.getHours() * 60 + fechaHoy.getMinutes(); // Convertir hora actual a minutos desde medianoche

  console.log("Hora actual en minutos:", horaActual); // Verificación de la hora actual

  this.asignaturas.forEach((asignatura) => {
    const horarios = asignatura.horarios[asignatura.tipoClase]; // obtener el horario según el tipo de clase (teorica o practica)

    // Verifica si el día de hoy está en los días de la asignatura
    const diaDisponible = asignatura.dias
      .map((dia: string) => dia.toLowerCase()) // Convertir los días de la asignatura a minúsculas
      .includes(this.diaActual.toLowerCase()); // Convertir el día actual a minúsculas
    console.log(`Días de la asignatura: ${asignatura.dias}, Día actual: ${this.diaActual}`);
    console.log("¿Está disponible el día de la asignatura?", diaDisponible);

    // Convierte las horas de inicio y fin de la clase a minutos desde medianoche
    const horaInicio = this.convertirAHoraEnMinutos(horarios.horaInicio);
    const horaFin = this.convertirAHoraEnMinutos(horarios.horaFin);

    console.log(`Comparando con horario: ${horaInicio} - ${horaFin}`); // Verificación de los horarios

    // Verifica si la hora actual está dentro del rango de las clases
    const estaDentroDelHorario = horaActual >= horaInicio && horaActual <= horaFin;

    console.log("Está dentro del horario:", estaDentroDelHorario); // Verificación de la comparación

    // Habilitar QR si está dentro del horario y día disponible
    this.horariosDisponibles[asignatura.id] = diaDisponible && estaDentroDelHorario;

    console.log('Estado de disponibilidad para la asignatura', asignatura.id, this.horariosDisponibles[asignatura.id]); // Verificación del estado
  });
}



  // Convierte una hora en formato ISO (HH:mm) a minutos desde medianoche
  convertirAHoraEnMinutos(hora: string): number {
    const [hh, mm] = hora.split(':').map(Number); // Convertir "HH:mm" a [HH, mm]
    return hh * 60 + mm; // Convertimos la hora a minutos
  }

  // Devuelve el nombre del día según el valor numérico (0-6)
  obtenerDiaSemana(dia: number): string {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return dias[dia].toLowerCase(); // Aseguramos que todo esté en minúsculas
  }

// Método para generar QR
irAGenerarQR(asignaturaId: string) {
  console.log('Intentando generar QR para la asignatura:', asignaturaId);

  if (this.isQRGenerated[asignaturaId]) {
    alert('La asistencia ya ha sido registrada para hoy en esta asignatura.');
    console.log('Asistencia ya registrada, QR bloqueado para asignatura:', asignaturaId);
  } else if (!this.horariosDisponibles[asignaturaId]) {
    alert('No es el momento adecuado para generar el QR. Verifique el horario de la clase.');
    console.log('Fuera de horario permitido para generar QR en asignatura:', asignaturaId);
  } else {
    console.log('Redirigiendo a la generación de QR para la asignatura:', asignaturaId);
    this.router.navigate(['/generate-qr'], { queryParams: { id: asignaturaId } });
  }
}

  verHistorial(asignaturaId: string) {
    console.log('Navegando al historial de asistencia para la asignatura:', asignaturaId);
    this.router.navigate(['/historial-asistencia-profesor'], { queryParams: { id: asignaturaId } });
  }
}
