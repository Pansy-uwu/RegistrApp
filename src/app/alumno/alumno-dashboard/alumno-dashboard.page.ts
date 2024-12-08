import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Barcode, BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-alumno-dashboard',
  templateUrl: './alumno-dashboard.page.html',
  styleUrls: ['./alumno-dashboard.page.scss'],
})
export class AlumnoDashboardPage implements OnInit {
  alumnoName: string = ''; 
  userRole: string = ''; 
  asignaturas: any[] = []; 
  currentDate: string = ''; 
  currentTime: string = ''; 
  userEmail: string = ''; 
  userUID: string = ''; 
  diaActual: string = ''; 
  asignaturasDelDia: any[] = []; 
  horariosDisponibles: { [key: string]: boolean } = {}; 
  isSupported = false; 
  barcodes: Barcode[] = []; 
  claseId: string = ''; 
  isAttendanceRegistered: boolean = false; 

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private afAuth: AngularFireAuth,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    await this.checkScannerSupport();
    this.checkAuthentication();
    this.setCurrentDate();
    this.setCurrentTime();
    this.diaActual = this.obtenerDiaSemana(new Date().getDay());

    setInterval(() => {
      this.setCurrentTime();
      this.actualizarHorariosDisponibles();
    }, 60000);
  }

  // Verificar si el escáner está soportado
  async checkScannerSupport() {
    try {
      const supported = await BarcodeScanner.isSupported();
      this.isSupported = supported.supported;
      if (!this.isSupported) {
        alert('El escáner de códigos de barras no está soportado en este dispositivo.');
      }
    } catch (error) {
      console.error('Error al verificar soporte del escáner:', error);
      alert('Error al verificar soporte del escáner.');
    }
  }

  // Escanear QR desde el dashboard
  // Escanear QR desde el dashboard
async scanQRCode(asignaturaId: string) {
  console.log('Iniciando escaneo para la asignatura:', asignaturaId);
  this.claseId = asignaturaId;

  // Validar si el horario actual permite el escaneo
  if (!this.horariosDisponibles[asignaturaId]) {
    alert('No puedes escanear el código QR fuera del horario de la clase.');
    return;
  }

  const moduleAvailable = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
  if (!moduleAvailable.available) {
    console.log('Instalando el módulo Google Barcode Scanner...');
    await BarcodeScanner.installGoogleBarcodeScannerModule();
    alert('El módulo Google Barcode Scanner ha sido instalado correctamente. Intenta escanear nuevamente.');
    return;
  }

  const granted = await this.requestPermissions();
  if (!granted) {
    this.presentPermissionAlert();
    return;
  }

  try {
    const { barcodes } = await BarcodeScanner.scan({
      formats: [BarcodeFormat.QrCode],
    });

    if (barcodes.length > 0) {
      const barcodeValue = barcodes[0].rawValue;
      this.barcodes.push(...barcodes);
      await this.onQRCodeScanned(barcodeValue);
    } else {
      alert('No se detectó ningún código QR.');
    }
  } catch (error) {
    alert('Error al escanear el código QR.');
  }
}


  async onQRCodeScanned(qrCode: string) {
    if (!this.claseId || !this.userUID || !this.userEmail) {
      alert('Faltan datos para registrar la asistencia.');
      return;
    }
    await this.registerAttendance();
  }

  async registerAttendance() {
    try {
      const fecha = new Date();
      const fechaFormateada = fecha.toLocaleDateString('en-CA');

      const refPath = `/asignaturas/${this.claseId}/asistencias/${this.userUID}`;
      const asistenciaAlumno = {
        estado: 'Presente',
        fecha: fechaFormateada,
        timestamp: fecha.toISOString(),
      };

      await this.firebaseService.updateData(refPath, asistenciaAlumno);
      alert('Asistencia registrada con éxito.');
    } catch (error) {
      alert('Error al registrar la asistencia.');
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { camera } = await BarcodeScanner.requestPermissions();
      return camera === 'granted' || camera === 'limited';
    } catch (error) {
      alert('Error al solicitar permisos.');
      return false;
    }
  }

  async presentPermissionAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permiso denegado',
      message: 'Por favor, concede permiso para usar la cámara.',
      buttons: ['OK'],
    });
    await alert.present();
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


  cargarAsignaturas(uid: string) {
    this.firebaseService.getData<{ [key: string]: any }>('asignaturas').subscribe({
      next: (data) => {
        console.log('Datos de Firebase (asignaturas):', data);
  
        if (data) {
          this.asignaturas = Object.entries(data)
            .filter(([id, value]) => value.alumnos && value.alumnos[uid])
            .map(([id, value]) => ({
              id,
              nombre: value.nombre || 'Sin Nombre',
              seccion: value.seccion || 'N/A',
              diasTeoricos: Array.isArray(value.dias) ? value.dias : value.dias?.teorica || [],
              diasPracticos: value.dias?.practica || [],
              horarioTeorico: value.horarios?.teorica || { horaInicio: 'N/A', horaFin: 'N/A' },
              horarioPractico: value.horarios?.practica || { horaInicio: 'N/A', horaFin: 'N/A' },
            }));
  
          console.log('Asignaturas asociadas al UID:', this.asignaturas);
          this.filtrarAsignaturasDelDia(); // Filtrar asignaturas del día
          this.actualizarHorariosDisponibles(); // Aquí
        } else {
          console.warn('No se encontraron asignaturas');
          this.asignaturas = [];
          this.asignaturasDelDia = [];
        }
      },
      error: (err) => {
        console.error('Error al cargar asignaturas:', err);
      },
    });
  }
  
  
  cargarAsignaturasDelDia() {
    this.asignaturasDelDia = this.asignaturas.filter((asignatura) => {
      const esDiaTeorico = asignatura.dias.teorica?.some(
        (dia: string) => dia.toLowerCase() === this.diaActual
      );
      const esDiaPractico = asignatura.dias.practica?.some(
        (dia: string) => dia.toLowerCase() === this.diaActual
      );
  
      // Determina si la asignatura tiene clases en el día actual.
      return esDiaTeorico || esDiaPractico;
    });
  
    // Actualiza el tipo de clase y horario según el día actual.
    this.asignaturasDelDia.forEach((asignatura) => {
      if (asignatura.dias.teorica?.includes(this.diaActual)) {
        asignatura.tipoClaseHoy = 'teorica';
        asignatura.horarioHoy = asignatura.horarios.teorica;
      } else if (asignatura.dias.practica?.includes(this.diaActual)) {
        asignatura.tipoClaseHoy = 'practica';
        asignatura.horarioHoy = asignatura.horarios.practica;
      }
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

  obtenerDiaActual() {
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const fechaHoy = new Date();
  this.diaActual = dias[fechaHoy.getDay()].toLowerCase();
  console.log('Día actual:', this.diaActual);
}

filtrarAsignaturasDelDia() {
  this.asignaturasDelDia = this.asignaturas.filter(asignatura => {
    const esDiaTeorico = asignatura.diasTeoricos?.some(
      (dia: string) => dia.toLowerCase() === this.diaActual
    );
    const esDiaPractico = asignatura.diasPracticos?.some(
      (dia: string) => dia.toLowerCase() === this.diaActual
    );

    // Establecer tipo de clase y horario según el día actual
    if (esDiaTeorico) {
      asignatura.tipoClaseHoy = 'Teórica';
      asignatura.horarioHoy = asignatura.horarioTeorico;
    } else if (esDiaPractico) {
      asignatura.tipoClaseHoy = 'Práctica';
      asignatura.horarioHoy = asignatura.horarioPractico;
    } else {
      asignatura.tipoClaseHoy = 'N/A';
      asignatura.horarioHoy = { horaInicio: 'N/A', horaFin: 'N/A' };
    }

    return esDiaTeorico || esDiaPractico;
  });
}


  // Ver historial de asistencia
  verHistorial(asignaturaId: string) {
    this.router.navigate(['/historial-asistencia-alumno'], {
      queryParams: { asignaturaId: asignaturaId },
    });
  }

  logout() {
    this.afAuth.signOut().then(() => {
      this.router.navigate(['/login']);
    });
  }

// Actualizar estado de disponibilidad de horarios para escanear QR
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
  const [hh, mm] = hora.split(':').map(Number); // Convertir "HH:mm" a [HH, mm]
  return hh * 60 + mm; // Convertir a minutos
}


}
