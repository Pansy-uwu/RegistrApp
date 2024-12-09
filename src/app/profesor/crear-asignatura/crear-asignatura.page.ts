import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';

@Component({
    selector: 'app-crear-asignatura',
    templateUrl: './crear-asignatura.page.html',
    styleUrls: ['./crear-asignatura.page.scss'],
})
export class CrearAsignaturaPage implements OnInit {
  asignatura = {
    nombre: '',
    seccion: '',
    tipoClase: 'teorica', // 'teorica', 'practica' o 'mixta'
    dias: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'], // Incluye los días completos, sin restricciones
    horarios: {
      teorica: { horaInicio: '', horaFin: '', salas: [] as string[] },
      practica: { horaInicio: '', horaFin: '', salas: [] as string[] },
    },
    profesor: '', // UID del profesor
    alumnos: {}, // Alumnos en formato { UID: true }
  };
  profesorUID: string = '';
  listaAlumnos: any[] = [];
  alumnosSeleccionados: string[] = []; // Almacena los UIDs de los alumnos seleccionados

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Obtener UID del profesor desde queryParams
    this.route.queryParams.subscribe((params) => {
      this.profesorUID = params['profesorUID'];
      if (this.profesorUID) {
        console.log('UID del profesor recibido:', this.profesorUID);
        this.asignatura.profesor = this.profesorUID;
      } else {
        console.error('No se recibió el UID del profesor.');
        alert('No se encontró el UID del profesor. Asegúrese de haber iniciado sesión.');
      }
    });

    // Cargar lista de alumnos
    this.cargarListaAlumnos();
  }

  // Cargar lista de alumnos desde Firebase
  cargarListaAlumnos() {
    console.log('Intentando cargar la lista de alumnos desde Firebase...');
    this.firebaseService.getData<{ [key: string]: any }>('/usuarios').subscribe({
      next: (snapshot) => {
        if (snapshot) {
          console.log('Datos crudos obtenidos de Firebase:', snapshot);

          // Procesar y filtrar los datos para obtener solo alumnos
          this.listaAlumnos = Object.entries(snapshot)
            .filter(([key, value]: [string, any]) => value.role === 'alumno')
            .map(([key, value]: [string, any]) => ({
              uid: key,
              ...value,
            }));

          console.log('Lista de alumnos cargada:', this.listaAlumnos);

          // Seleccionar el primer alumno de forma predeterminada
          if (this.listaAlumnos.length > 0) {
            this.alumnosSeleccionados = [this.listaAlumnos[0].uid];
          }
        } else {
          console.warn('No se encontraron datos en la ruta /usuarios.');
          this.listaAlumnos = [];
        }
      },
      error: (error) => {
        console.error('Error al cargar la lista de alumnos:', error);
        this.listaAlumnos = [];
      },
    });
  }

  // Crear asignatura
 // Crear asignatura
async crearAsignatura() {
  console.log('Iniciando creación de asignatura...');

  if (!this.profesorUID) {
    alert('No se encontró el UID del profesor.');
    return;
  }

  if (!this.validarCamposLlenos()) {
    alert('Por favor, complete todos los campos obligatorios.');
    return;
  }

  try {
    console.log('Intentando incrementar el contador...');
    const nuevoNumero = await this.incrementarContador();
    console.log('Nuevo número obtenido del contador:', nuevoNumero);

    const nuevoIdAsignatura = `ASG${nuevoNumero}`;
    console.log(`Nuevo ID generado para la asignatura: ${nuevoIdAsignatura}`);

    // Convertir alumnos seleccionados al formato correcto
    const alumnosBooleanos: { [key: string]: boolean } = {};
    this.alumnosSeleccionados.forEach((uid) => {
      alumnosBooleanos[uid] = true;
    });
    this.asignatura.alumnos = alumnosBooleanos;

    // ** Formatear las horas de inicio y fin antes de guardar **
    if (this.asignatura.horarios.teorica.horaInicio) {
      this.asignatura.horarios.teorica.horaInicio = this.formatearHora(this.asignatura.horarios.teorica.horaInicio);
    }
    if (this.asignatura.horarios.teorica.horaFin) {
      this.asignatura.horarios.teorica.horaFin = this.formatearHora(this.asignatura.horarios.teorica.horaFin);
    }

    if (this.asignatura.horarios.practica.horaInicio) {
      this.asignatura.horarios.practica.horaInicio = this.formatearHora(this.asignatura.horarios.practica.horaInicio);
    }
    if (this.asignatura.horarios.practica.horaFin) {
      this.asignatura.horarios.practica.horaFin = this.formatearHora(this.asignatura.horarios.practica.horaFin);
    }

    console.log('Asignatura procesada antes de guardar:', this.asignatura);

    const asignaturaPath = `asignaturas/${nuevoIdAsignatura}`;
    await this.firebaseService.setData(asignaturaPath, this.asignatura);

    alert(`Asignatura creada con éxito. ID: ${nuevoIdAsignatura}`);
    this.router.navigate(['/profesor-dashboard']);
  } catch (error) {
    console.error('Error al crear la asignatura:', error);
    alert('Hubo un error al crear la asignatura.');
  }
}

  

// Incrementar el contador de asignaturas de manera atómica
async incrementarContador(): Promise<number> {
  console.log('Iniciando incremento directo del contador...');
  try {
    const contadorPath = '/asignaturasCounter';

    // Leer el valor actual utilizando el método modificado
    const contadorActual = await this.firebaseService.getDataOnce<number>(contadorPath);
    console.log('Valor actual del contador leído desde Firebase:', contadorActual);

    // Si no existe, inicializar en 1
    const nuevoValor = contadorActual !== null ? contadorActual + 1 : 1;

    console.log('Nuevo valor calculado:', nuevoValor);

    // Escribir el nuevo valor en Firebase
    await this.firebaseService.setData(contadorPath, nuevoValor);
    console.log('Contador actualizado en Firebase:', nuevoValor);

    return nuevoValor;
  } catch (error) {
    console.error('Error al incrementar el contador:', error);
    throw new Error('No se pudo incrementar el contador.');
  }
}



  validarCamposLlenos(): boolean {
    const { nombre, seccion, dias, horarios, tipoClase } = this.asignatura;

    if (!nombre || !seccion || !dias.length) {
      console.error('Faltan campos obligatorios: Nombre, Sección o Días.');
      return false;
    }

    const horariosValidos =
      tipoClase === 'teorica'
        ? horarios.teorica.horaInicio && horarios.teorica.horaFin && horarios.teorica.salas.length > 0
        : horarios.practica.horaInicio && horarios.practica.horaFin && horarios.practica.salas.length > 0;

    if (!horariosValidos) {
      console.error('Faltan horarios obligatorios para el tipo de clase seleccionado.');
      return false;
    }

    return true;
  }

// Función para formatear las horas en el formato 00:00 (solo hora y minutos)
formatearHora(hora: string): string {
  if (!hora) return '00:00'; // Si la hora no está definida, devolvemos 00:00 por defecto

  try {
    // Extraer solo la parte de la hora y minutos, eliminando la fecha y segundos si existen
    const timePart = hora.includes('T') ? hora.split('T')[1] : hora; // Si tiene formato ISO, toma la parte después de la 'T'
    const [h, m] = timePart.split(':'); // Dividir la hora por los dos puntos ":"
    
    // Aseguramos que tanto la hora como los minutos tengan dos dígitos
    const horaFormateada = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    
    console.log(`Hora original: ${hora} | Hora formateada: ${horaFormateada}`);
    return horaFormateada;
  } catch (error) {
    console.error('Error al formatear la hora:', error);
    return '00:00'; // Devolver 00:00 en caso de error
  }
}

}
