import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-generate-qr',
  templateUrl: './generate-qr.page.html',
  styleUrls: ['./generate-qr.page.scss'],
})
export class GenerateQrPage implements OnInit {
  @ViewChild('qrCodeCanvas', { static: true }) qrCodeCanvas!: ElementRef;
  asignaturaId: string = '';
  qrCodeData: string = '';
  estudiantesRegistrados: any[] = [];
  subscription: Subscription | undefined;
  asignaturaNombre: string = '';

  constructor(
    private route: ActivatedRoute,
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('Iniciando GenerateQRPage...');
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.asignaturaId = params['id'];
        this.qrCodeData = this.asignaturaId;
        console.log('Asignatura ID recibido:', this.asignaturaId);
        this.cargarAsignatura();
        this.escucharAsistencias();
      } else {
        console.error('No se proporcionó un ID de asignatura.');
        alert('ID de asignatura no válido.');
        this.router.navigate(['/profesor-dashboard']);
      }
    });
  }
  
  cargarAsignatura() {
    this.firebaseService.getDataOnce(`asignaturas/${this.asignaturaId}`).then((asignatura: any) => {
      if (asignatura && asignatura.nombre) {
        this.asignaturaNombre = asignatura.nombre;
        console.log('Nombre de la asignatura cargado:', this.asignaturaNombre);
      } else {
        console.error('No se encontró la asignatura o no tiene un nombre.');
      }
    }).catch((error) => {
      console.error('Error al cargar la asignatura:', error);
    });
  }
  
  escucharAsistencias() {
    console.log('Iniciando escucha de asistencias en tiempo real...');
    
    this.firebaseService.getData<any>(`asignaturas/${this.asignaturaId}/asistencias`).subscribe(
      (snapshot) => {
        if (snapshot && typeof snapshot === 'object') {
          console.log('Datos de asistencias en tiempo real:', snapshot);
          
          const clases = Object.entries(snapshot).sort(([claseA], [claseB]) => claseA.localeCompare(claseB));
          const ultimaClase = clases[clases.length - 1];
          
          if (ultimaClase) {
            const [claseId, estudiantesRaw] = ultimaClase;
            console.log(`Última clase detectada (${claseId}):`, estudiantesRaw);
            
            if (typeof estudiantesRaw === 'object' && estudiantesRaw !== null) {
              this.estudiantesRegistrados = Object.entries(estudiantesRaw).map(([uid, details]) => ({
                uid,
                ...details,
              }));
              console.log('Estudiantes registrados:', this.estudiantesRegistrados);
            } else {
              console.error('Los datos de estudiantes no son válidos:', estudiantesRaw);
              this.estudiantesRegistrados = [];
            }
          } else {
            console.log('No se encontraron clases registradas.');
            this.estudiantesRegistrados = [];
          }
        } else {
          console.log('El nodo de asistencias está vacío o no es un objeto válido.');
          this.estudiantesRegistrados = [];
        }
      },
      (error) => {
        console.error('Error al escuchar asistencias:', error);
      }
    );
  }
  

  guardarAsistencia() {
    console.log('Validando estudiantes registrados...');
    if (this.estudiantesRegistrados.length === 0) {
      alert('No hay estudiantes registrados para confirmar la asistencia.');
      console.log('Intento de guardar asistencia sin estudiantes registrados.');
      return;
    }

    const confirmar = confirm('¿Desea guardar la asistencia?');
    if (!confirmar) {
      console.log('El usuario canceló la confirmación de la asistencia.');
      return;
    }

    console.log('Estudiantes registrados confirmados. Redirigiendo al dashboard del profesor...');
    this.router.navigate(['/profesor-dashboard'])
      .then(() => {
        console.log('Redirección al dashboard completada con éxito.');
      })
      .catch((error) => {
        console.error('Error durante la redirección:', error);
      });
  }
}
