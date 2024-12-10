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
  async scanQRCode(asignaturaId: string) {
    console.log('Iniciando escaneo para la asignatura:', asignaturaId);
    this.claseId = asignaturaId;

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
