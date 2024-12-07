import { Component, OnInit } from '@angular/core';
import { Barcode, BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { FirebaseService } from '../../services/firebase.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-scan-qr',
  templateUrl: './scan-qr.page.html',
  styleUrls: ['./scan-qr.page.scss'],
})
export class ScanQrPage implements OnInit {
  isSupported = false; // Indica si el escáner está soportado
  barcodes: Barcode[] = []; // Almacena los códigos escaneados
  claseId: string = ''; // ID de la clase
  userUID: string = ''; // UID del usuario
  userEmail: string = ''; // Email del usuario
  isAttendanceRegistered: boolean = false; // Bandera para evitar múltiples registros

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    try {
      // Verificar soporte del escáner
      const supported = await BarcodeScanner.isSupported();
      this.isSupported = supported.supported;

      // Obtener parámetros de navegación
      this.route.queryParams.subscribe(params => {
        this.claseId = params['asignaturaId'];
        this.userUID = params['userUID'];
        this.userEmail = params['userEmail'];

        console.log('Parámetros recibidos en ScanQrPage:');
        console.log('Clase ID:', this.claseId);
        console.log('User UID:', this.userUID);
        console.log('User Email:', this.userEmail);

        if (!this.claseId || !this.userUID || !this.userEmail) {
          alert('Faltan parámetros para procesar la solicitud.');
          this.router.navigate(['/dashboard-alumno']);
        } else {
          alert(`Parámetros recibidos:
          Clase ID: ${this.claseId}
          User UID: ${this.userUID}
          User Email: ${this.userEmail}`);
        }
      });
    } catch (error) {
      const errorMessage = (error as Error).message || String(error);
      console.error('Error al verificar soporte del escáner:', errorMessage);
      alert('Error al verificar soporte del escáner.');
    }
  }

  async scan(): Promise<void> {
    console.log('Datos enviados al escáner:');
    console.log('Clase ID:', this.claseId);
    console.log('User UID:', this.userUID);
    console.log('User Email:', this.userEmail);

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
      console.log('Iniciando escaneo...');
      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode],
      });

      if (barcodes.length > 0) {
        const barcodeValue = barcodes[0].rawValue;
        console.log('Código QR detectado:', barcodeValue);
        this.barcodes.push(...barcodes);
        await this.onQRCodeScanned(barcodeValue);
      } else {
        console.error('No se detectó ningún código QR.');
        alert('No se detectó ningún código QR.');
      }
    } catch (error) {
      const errorMessage = (error as Error).message || String(error);
      console.error('Error al escanear el código QR:', errorMessage);
      alert(`Error al escanear el código QR: ${errorMessage}`);
    }
  }

  async onQRCodeScanned(qrCode: string) {
    console.log('Código QR escaneado:', qrCode);

    if (!this.claseId || !this.userUID || !this.userEmail) {
      console.error('Datos incompletos para registrar la asistencia.');
      alert('Datos incompletos para registrar la asistencia.');
      return;
    }

    await this.registerAttendance();
  }

  async registerAttendance() {
    try {
      if (!this.claseId || !this.userUID || !this.userEmail) {
        console.error('Datos incompletos para registrar la asistencia.');
        alert('Faltan datos para registrar la asistencia.');
        return;
      }
  
      const fecha = new Date();
      const fechaFormateada = fecha.toLocaleDateString('en-CA');
  
      console.log('Obteniendo datos del usuario...');
      const userSnapshot = await this.firebaseService
        .getDatabaseRef(`/usuarios/${this.userUID}`)
        .once('value');
      const userData = userSnapshot.val();
  
      if (!userData) {
        throw new Error(`No se encontró información del usuario con UID: ${this.userUID}`);
      }
  
      const nombreCompleto = `${userData.nombre} ${userData.apellido}`;
      console.log('Nombre completo del alumno:', nombreCompleto);
  
      console.log('Obteniendo asistencias actuales...');
      const asistenciasSnapshot = await this.firebaseService
        .getDatabaseRef(`/asignaturas/${this.claseId}/asistencias`)
        .once('value');
      const asistencias = asistenciasSnapshot.val() || {};
  
      // Verificar si el usuario ya tiene asistencia para la fecha actual
      let asistenciaRegistrada = false;
  
      Object.values(asistencias).forEach((clase: any) => {
        if (clase[this.userUID] && clase[this.userUID].fecha === fechaFormateada) {
          asistenciaRegistrada = true;
        }
      });
  
      if (asistenciaRegistrada) {
        alert('QR ya escaneado por hoy, asistencia registrada previamente.');
        this.router.navigate(['/alumno-dashboard']).then(() => {
          console.log('Redirigido exitosamente al Dashboard del Alumno.');
        }).catch(error => {
          console.error('Error al redirigir al Dashboard del Alumno:', error);
        });
        console.log('El alumno ya tiene asistencia registrada hoy.');
        return;
      }
  
      // Registrar nueva asistencia
      const claseId = `Clase ${Object.keys(asistencias).length + 1}`;
      const asistenciaAlumno = {
        nombre: nombreCompleto,
        estado: 'Presente',
        fecha: fechaFormateada,
        timestamp: fecha.toISOString(),
      };
  
      console.log('Datos de asistencia del alumno:', asistenciaAlumno);
  
      const refPath = `/asignaturas/${this.claseId}/asistencias/${claseId}/${this.userUID}`;
      console.log('Intentando actualizar en Firebase:', refPath);
  
      await this.firebaseService.updateData(refPath, asistenciaAlumno);
  
      console.log('Asistencia registrada con éxito en:', refPath);
  
      // Mostrar mensaje de éxito y redirigir al Dashboard del Alumno
      alert(`Asistencia registrada con éxito: ${claseId}`);
      this.router.navigate(['/alumno-dashboard']).then(() => {
        console.log('Redirigido exitosamente al Dashboard del Alumno.');
      }).catch(error => {
        console.error('Error al redirigir al Dashboard del Alumno:', error);
      });
    } catch (error) {
      const errorMessage = (error as Error).message || String(error);
      console.error('Error al registrar la asistencia:', errorMessage);
      alert('Error al registrar la asistencia. Verifica los detalles en la consola.');
    }
  }
  
  

  async requestPermissions(): Promise<boolean> {
    try {
      const { camera } = await BarcodeScanner.requestPermissions();
      return camera === 'granted' || camera === 'limited';
    } catch (error) {
      const errorMessage = (error as Error).message || String(error);
      console.error('Error al solicitar permisos:', errorMessage);
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
}
