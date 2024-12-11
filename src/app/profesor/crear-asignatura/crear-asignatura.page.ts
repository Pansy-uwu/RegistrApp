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
    tipoClase: 'teorica',
    dias: [] as string[] | { teorica: string[]; practica: string[] },
    horarios: {
      teorica: { horaInicio: '', horaFin: '', salas: [] as string[] },
      practica: { horaInicio: '', horaFin: '', salas: [] as string[] },
    },
    profesor: '',
    alumnos: {},
    asistencias: {},
  };

  profesorUID: string = '';
  listaAlumnos: any[] = [];
  alumnosSeleccionados: string[] = [];
  diasTeorica: string = ''; // Día específico para clases teóricas (mixta)
  diasPractica: string = ''; // Día específico para clases prácticas (mixta)

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.profesorUID = params['profesorUID'];
      if (this.profesorUID) {
        this.asignatura.profesor = this.profesorUID;
      } else {
        alert('No se encontró el UID del profesor. Asegúrese de haber iniciado sesión.');
      }
    });
    this.cargarListaAlumnos();
  }

  cargarListaAlumnos() {
    this.firebaseService.getData<{ [key: string]: any }>('/usuarios').subscribe({
      next: (snapshot) => {
        if (snapshot) {
          this.listaAlumnos = Object.entries(snapshot)
            .filter(([key, value]: [string, any]) => value.role === 'alumno')
            .map(([key, value]: [string, any]) => ({
              uid: key,
              ...value,
            }));
        } else {
          this.listaAlumnos = [];
        }
      },
      error: (error) => {
        console.error('Error al cargar la lista de alumnos:', error);
        this.listaAlumnos = [];
      },
    });
  }

  async crearAsignatura() {
    if (!this.profesorUID) {
      alert('No se encontró el UID del profesor.');
      return;
    }
  
    if (!this.validarCamposLlenos()) {
      alert('Por favor, complete todos los campos obligatorios.');
      return;
    }
  
    try {
      const nuevoNumero = await this.incrementarContador();
      const nuevoIdAsignatura = `ASG${nuevoNumero}`;
  
      const alumnosBooleanos: { [key: string]: boolean } = {};
      this.alumnosSeleccionados.forEach((uid) => {
        alumnosBooleanos[uid] = true;
      });
      this.asignatura.alumnos = alumnosBooleanos;
  
      // Procesar días y horarios según el tipo de clase
      if (this.asignatura.tipoClase === 'teorica') {
        this.asignatura.dias = (this.asignatura.dias as string[]).filter((dia: string) => dia);
        this.asignatura.horarios.practica = { horaInicio: '', horaFin: '', salas: [] }; // Limpiar horarios de práctica
      } else if (this.asignatura.tipoClase === 'practica') {
        this.asignatura.dias = (this.asignatura.dias as string[]).filter((dia: string) => dia);
        this.asignatura.horarios.teorica = { horaInicio: '', horaFin: '', salas: [] }; // Limpiar horarios de teoría
      } else if (this.asignatura.tipoClase === 'mixta') {
        if (!this.diasTeorica || !this.diasPractica) {
          alert('Error: Para clases mixtas, debe seleccionar exactamente un día para teórica y uno para práctica.');
          return;
        }
        this.asignatura.dias = {
          teorica: [this.diasTeorica],
          practica: [this.diasPractica],
        };
      }
  
      // Formatear horarios
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
  
      const asignaturaPath = `asignaturas/${nuevoIdAsignatura}`;
      const asignaturaData = {
        ...this.asignatura,
        asistencias: {},
      };
  
      await this.firebaseService.setData(asignaturaPath, asignaturaData);
  
      alert(`Asignatura creada con éxito. ID: ${nuevoIdAsignatura}`);
      this.reiniciarFormulario();
      this.router.navigate(['/profesor-dashboard']);
    } catch (error) {
      console.error('Error al crear la asignatura:', error);
      alert('Hubo un error al crear la asignatura.');
    }
  }
  

  validarCamposLlenos(): boolean {
    const { nombre, seccion, dias, horarios, tipoClase } = this.asignatura;
    if (!nombre || !seccion || (!Array.isArray(dias) && (!dias.teorica || !dias.practica))) {
      return false;
    }
  
    const horariosValidos =
      tipoClase === 'teorica'
        ? this.validarHorario(horarios.teorica.horaInicio, horarios.teorica.horaFin) &&
          horarios.teorica.salas.length > 0
        : tipoClase === 'practica'
          ? this.validarHorario(horarios.practica.horaInicio, horarios.practica.horaFin) &&
            horarios.practica.salas.length > 0
          : this.validarHorario(horarios.teorica.horaInicio, horarios.teorica.horaFin) &&
            horarios.teorica.salas.length > 0 &&
            this.validarHorario(horarios.practica.horaInicio, horarios.practica.horaFin) &&
            horarios.practica.salas.length > 0;
  
    return horariosValidos;
  }
  

  validarHorario(horaInicio: string, horaFin: string): boolean {
    const inicio = this.convertirHora(horaInicio);
    const fin = this.convertirHora(horaFin);
    const limiteInicio = this.convertirHora('08:30');
    const limiteFin = this.convertirHora('22:00');
  
    if (inicio === null || fin === null || limiteInicio === null || limiteFin === null) {
      alert('Error al validar los horarios. Asegúrate de que todos los horarios estén en un formato válido.');
      return false;
    }
  
    if (inicio < limiteInicio || fin > limiteFin) {
      alert('Los horarios deben estar entre las 8:30 y las 22:00.');
      return false;
    }
  
    if (inicio >= fin) {
      alert('La hora de inicio debe ser menor que la hora de fin.');
      return false;
    }
  
    return true;
  }
  

  convertirHora(hora: string): number | null {
    if (!hora) return null;
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos; // Convertir a minutos para facilitar la comparación
  }
  

  formatearHora(hora: string): string {
    if (!hora) return '00:00';
    try {
      const timePart = hora.includes('T') ? hora.split('T')[1] : hora;
      const [h, m] = timePart.split(':');
      return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
    } catch (error) {
      console.error('Error al formatear la hora:', error);
      return '00:00';
    }
  }

  reiniciarFormulario() {
    this.asignatura = {
      nombre: '',
      seccion: '',
      tipoClase: 'teorica',
      dias: [] as string[] | { teorica: string[]; practica: string[] },
      horarios: {
        teorica: { horaInicio: '', horaFin: '', salas: [] },
        practica: { horaInicio: '', horaFin: '', salas: [] },
      },
      profesor: '',
      alumnos: {},
      asistencias: {},
    };
    this.diasTeorica = '';
    this.diasPractica = '';
    this.alumnosSeleccionados = [];
  }

  async incrementarContador(): Promise<number> {
    try {
      const contadorPath = '/asignaturasCounter';
      const contadorActual = await this.firebaseService.getDataOnce<number>(contadorPath);
      const nuevoValor = contadorActual !== null ? contadorActual + 1 : 1;
      await this.firebaseService.setData(contadorPath, nuevoValor);
      return nuevoValor;
    } catch (error) {
      console.error('Error al incrementar el contador:', error);
      throw new Error('No se pudo incrementar el contador.');
    }
  }
}
