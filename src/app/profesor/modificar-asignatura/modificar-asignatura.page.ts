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
        this.cargarDatosAsignatura(asignaturaId);
      } else {
        alert('No se proporcionó un ID de asignatura válido.');
        this.router.navigate(['/profesor-dashboard']);
      }
    });
  }
  
  
  cargarDatosAsignatura(id: string) {
    this.firebaseService.getDataOnce(`/asignaturas/${id}`).then((data: any) => {
      if (data) {
        this.asignatura = data;
  
        // Convertir las claves del objeto alumnos en un arreglo
        this.alumnosSeleccionados = Object.keys(data.alumnos || {});
        console.log('Alumnos seleccionados:', this.alumnosSeleccionados); // Verifica los alumnos seleccionados
      } else {
        alert('No se encontró la asignatura.');
        this.router.navigate(['/profesor-dashboard']);
      }
    }).catch((error) => {
      console.error('Error al cargar la asignatura:', error);
    });
  }
  

  isLoading = true;

  cargarListaAlumnos() {
    this.firebaseService.getData('/usuarios').subscribe((snapshot: any) => {
      this.listaAlumnos = Object.entries(snapshot || {})
        .filter(([_, value]: [string, any]) => value.role === 'alumno')
        .map(([key, value]: [string, any]) => ({ uid: key, ...value }));
      this.isLoading = false; // Indica que los datos están listos
    });
  }
  
  
  
  

  async modificarAsignatura() {
    try {
      const alumnosBooleanos: { [key: string]: boolean } = {};
      this.alumnosSeleccionados.forEach((uid) => {
        alumnosBooleanos[uid] = true;
      });
      this.asignatura.alumnos = alumnosBooleanos;
  
      await this.firebaseService.updateData(`/asignaturas/${this.asignatura.id}`, this.asignatura);
      alert('Asignatura modificada con éxito.');
      this.router.navigate(['/profesor-dashboard']);
    } catch (error) {
      console.error('Error al modificar la asignatura:', error);
      alert('Hubo un error al modificar la asignatura.');
    }
  }
  
}
