import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-modificar-asignatura',
  templateUrl: './modificar-asignatura.page.html',
  styleUrls: ['./modificar-asignatura.page.scss'],
})
export class ModificarAsignaturaPage implements OnInit {
  asignatura: any = {};
  listaAlumnos: any[] = [];
  alumnosSeleccionados: string[] = [];
  asignaturaId: string = '';
  isLoading = true;

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.cargarListaAlumnos();

    this.route.queryParams.subscribe((params) => {
      const asignaturaId = params['asignaturaId'];
      if (asignaturaId) {
        this.asignaturaId = asignaturaId;
        this.cargarDatosAsignatura(this.asignaturaId);
      } else {
        alert('No se proporcionó un ID de asignatura válido.');
        this.router.navigate(['/profesor-dashboard']);
      }
    });
  }

  cargarDatosAsignatura(id: string) {
    this.firebaseService.getDataOnce(`/asignaturas/${id}`)
      .then((data: any) => {
        if (data) {
          this.asignatura = data;
          this.alumnosSeleccionados = Object.keys(data.alumnos || {}); // Convertir las claves del objeto alumnos a un array
          console.log('Datos de la asignatura cargados:', this.asignatura);
        } else {
          alert('No se encontró la asignatura.');
          this.router.navigate(['/profesor-dashboard']);
        }
      })
      .catch((error) => {
        console.error('Error al cargar la asignatura:', error);
      });
  }

  cargarListaAlumnos() {
    this.firebaseService.getData('/usuarios').subscribe((snapshot: any) => {
      this.listaAlumnos = Object.entries(snapshot || {})
        .filter(([_, value]: [string, any]) => value.role === 'alumno')
        .map(([key, value]: [string, any]) => ({ uid: key, ...value }));
      console.log('Lista de alumnos cargada:', this.listaAlumnos);
      this.isLoading = false; // Indica que los datos están listos
    });
  }

  async modificarAsignatura() {
    if (!this.asignaturaId) {
      alert('No se puede modificar porque falta el ID de la asignatura.');
      return;
    }

    try {
      // Convertir los alumnos seleccionados en un objeto con valores booleanos
      const alumnosBooleanos: { [key: string]: boolean } = {};
      this.alumnosSeleccionados.forEach((uid) => {
        alumnosBooleanos[uid] = true;
      });

      // Actualizar los alumnos en la asignatura
      this.asignatura.alumnos = alumnosBooleanos;

      // Actualizar los datos en Firebase usando la ruta correcta
      const rutaAsignatura = `/asignaturas/${this.asignaturaId}`;
      await this.firebaseService.updateData(rutaAsignatura, this.asignatura);

      alert('Asignatura modificada con éxito.');
      this.router.navigate(['/profesor-dashboard']);
    } catch (error) {
      console.error('Error al modificar la asignatura:', error);
      alert('Hubo un error al modificar la asignatura.');
    }
  }
}
