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
  asignaturasDelDia: any[] = []; // Asignaturas del día actual
  todasLasAsignaturas: any[] = []; // Todas las asignaturas del profesor
  profesorUID: string = '';
  isQRGenerated: { [key: string]: boolean } = {};
  horariosDisponibles: { [key: string]: boolean } = {};
  diaActual: string = '';

  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('Iniciando ProfesorDashboardPage...');
    this.obtenerProfesorUID();
    this.diaActual = this.obtenerDiaSemana(new Date().getDay());
  }

  async obtenerProfesorUID() {
    try {
      const usuarioActual = await this.authService.getUsuarioActual();
      if (usuarioActual && usuarioActual.uid) {
        this.profesorUID = usuarioActual.uid;
        this.cargarAsignaturas();
      } else {
        alert('No se encontró el UID del profesor. Asegúrese de haber iniciado sesión.');
      }
    } catch (error) {
      alert('Hubo un error al obtener los datos del usuario.');
    }
  }

  cargarAsignaturas() {
    this.firebaseService.getData<{ [key: string]: any }>('asignaturas').subscribe((data) => {
      if (data) {
        // Filtrar asignaturas por UID del profesor
        this.todasLasAsignaturas = Object.entries(data)
          .filter(([key, value]: any) => value.profesor === this.profesorUID)
          .map(([key, value]: any) => ({
            id: key,
            ...value,
          }));

        // Filtrar asignaturas del día actual
        this.asignaturasDelDia = this.todasLasAsignaturas.filter((asignatura) =>
          asignatura.dias.some((dia: string) => dia.toLowerCase() === this.diaActual)
        );

        this.inicializarEstadoQR();
        this.inicializarHorariosDisponibles();
      }
    });
  }

  inicializarEstadoQR() {
    const fechaHoy = new Date().toISOString().split('T')[0];
    this.todasLasAsignaturas.forEach((asignatura) => {
      const asistenciaPath = `asignaturas/${asignatura.id}/asistencias/${fechaHoy}`;
      this.firebaseService.getData<any>(asistenciaPath).subscribe((data) => {
        this.isQRGenerated[asignatura.id] = !!data && Object.keys(data).length > 0;
      });
    });
  }

  inicializarHorariosDisponibles() {
    const fechaHoy = new Date();
    const horaActual = fechaHoy.getHours() * 60 + fechaHoy.getMinutes();

    this.todasLasAsignaturas.forEach((asignatura) => {
      const horarios = asignatura.horarios[asignatura.tipoClase];

      if (!horarios) {
        this.horariosDisponibles[asignatura.id] = false;
        return;
      }

      const horaInicio = this.convertirAHoraEnMinutos(horarios.horaInicio);
      const horaFin = this.convertirAHoraEnMinutos(horarios.horaFin);

      const diaDisponible = asignatura.dias
        ?.map((dia: string) => dia.toLowerCase())
        .includes(this.diaActual.toLowerCase());

      this.horariosDisponibles[asignatura.id] = diaDisponible && horaActual >= horaInicio && horaActual <= horaFin;
    });
  }

  convertirAHoraEnMinutos(hora: string): number {
    const [hh, mm] = hora.split(':').map(Number);
    return hh * 60 + mm;
  }

  obtenerDiaSemana(dia: number): string {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return dias[dia].toLowerCase();
  }

  irACrearAsignatura() {
    this.router.navigate(['/crear-asignatura'], { queryParams: { profesorUID: this.profesorUID } });
  }

  irAGenerarQR(asignaturaId: string) {
    if (this.isQRGenerated[asignaturaId]) {
      alert('La asistencia ya ha sido registrada para hoy en esta asignatura.');
    } else if (!this.horariosDisponibles[asignaturaId]) {
      alert('No es el momento adecuado para generar el QR.');
    } else {
      this.router.navigate(['/generate-qr'], { queryParams: { id: asignaturaId } });
    }
  }

  verHistorial(asignaturaId: string) {
    this.router.navigate(['/historial-asistencia-profesor'], { queryParams: { id: asignaturaId } });
  }
}
