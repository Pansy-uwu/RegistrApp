import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  constructor(private db: AngularFireDatabase) {
  }

  async crearAsignatura(asignatura: any): Promise<void> {
    try {
      const id = this.db.createPushId(); // Generar un ID único para la asignatura
      console.log('ID generado:', id);
      console.log('Asignatura a guardar en Firebase:', asignatura);
      await this.db.object(`/asignaturas/${id}`).set(asignatura);
      console.log('Asignatura creada correctamente en Firebase.');
    } catch (error) {
      console.error('Error al guardar la asignatura en Firebase:', error);
      throw error; // Lanza el error para que sea capturado en el componente
    }
  }
  

  // Obtener lista de alumnos
  getAlumnos(): Observable<any[]> {
    return this.db
      .list('/usuarios', (ref) => ref.orderByChild('role').equalTo('alumno'))
      .valueChanges();
  }
  
  getAsignaturas(): Observable<any[]> {
    return this.db.list('/asignaturas').valueChanges();
  }

  async getUserData(uid: string): Promise<{ nombre: string, apellido: string }> {
    try {
      const userDoc = await this.db.object(`/usuarios/${uid}`).query.once('value');
      const userData = userDoc.val();
      if (userData && userData.nombre && userData.apellido) {
        return { nombre: userData.nombre, apellido: userData.apellido };
      } else {
        throw new Error('No se encontró el nombre o apellido del usuario');
      }
    } catch (error) {
      console.error('Error al obtener los datos del usuario:', error);
      throw error;
    }
  }
  
  async getDataManual(path: string): Promise<any> {
    console.log(`Intentando obtener datos desde: ${path}`);
    try {
      const snapshot = await this.db.object(path).query.once('value');
      const data = snapshot.val();
      console.log('Datos obtenidos manualmente:', data);
      return data;
    } catch (error) {
      console.error(`Error al obtener datos desde la ruta: ${path}`, error);
      throw error;
    }
  }
  
  

  async guardarAsistencias(claseId: string, userUID: string, asistencia: any): Promise<void> {
    try {
      const asistenciasRef = this.db.list(`/asignaturas/${claseId}/asistencias`);
  
      // Obtener todas las clases existentes
      const snapshot = await asistenciasRef.query.once('value');
      const clases = snapshot.val() || {};
  
      // Determinar el identificador de clase ("Clase X")
      const claseNumero = `Clase ${Object.keys(clases).length + 1}`;
  
      // Registrar la asistencia del usuario en la nueva clase
      const claseActualRef = this.db.object(`/asignaturas/${claseId}/asistencias/${claseNumero}/${userUID}`);
      await claseActualRef.set(asistencia);
  
      console.log(`Asistencia registrada con éxito en ${claseNumero}`);
    } catch (error) {
      console.error('Error al registrar la asistencia:', error);
      throw new Error('Hubo un problema al registrar la asistencia.');
    }
  }

  async guardarDatosAsistencia(claseId: string, claseNumero: string, userUID: string, asistencia: any): Promise<void> {
    try {
      const asistenciaRef = this.db.object(`/asignaturas/${claseId}/asistencias/${claseNumero}/${userUID}`);
      await asistenciaRef.update(asistencia);
  
      console.log('Datos de asistencia actualizados con éxito');
    } catch (error) {
      console.error('Error al actualizar los datos de asistencia:', error);
      throw new Error('Hubo un problema al actualizar los datos de asistencia.');
    }
  }
  
  async obtenerAsistenciasDeAlumno(claseId: string, userUID: string): Promise<any[]> {
    try {
      const asistenciasRef = this.db.list(`/asignaturas/${claseId}/asistencias`);
      const snapshot = await asistenciasRef.query.once('value');
      const clases = snapshot.val() || {};
  
      const asistencias = Object.entries(clases).map(([clase, alumnos]: any) => {
        return {
          clase,
          ...alumnos[userUID],
        };
      });
  
      return asistencias.filter((asistencia) => asistencia);
    } catch (error) {
      console.error('Error al obtener asistencias del alumno:', error);
      throw error;
    }
  }
  
  
  
  // Método para obtener asignaturas por profesor
  obtenerAsignaturasPorProfesor(profesorId: string): Observable<any[]> {
    return this.db
      .list('/asignaturas', (ref) => ref.orderByChild('profesorId').equalTo(profesorId))
      .snapshotChanges()
      .pipe(
        map((changes: any[]) => {
          return changes.map((c) => ({
            id: c.payload.key,
            ...c.payload.val()
          }));
        })
      );
  }

  getAsignatura(id: string): Observable<any> {
    return this.db.object(`/asignaturas/${id}`).valueChanges();
  }

  obtenerAsistenciasPorAsignatura(asignaturaId: string) {
    return this.db
      .list(`/asistencias/${asignaturaId}`)
      .valueChanges();
  }
  getHistorialAsistencias(asignaturaId: string) {
    return this.db
      .object(`/asignaturas/${asignaturaId}/asistencias`)
      .valueChanges();
  }
  
  obtenerClases(): Observable<any[]> {
    return this.db.list(`/asignaturas`).valueChanges();
  }
  
  getData<T>(path: string): Observable<T | null> {
    return this.db.object<T>(path).valueChanges();
  }

  getDataOnce<T>(path: string): Promise<T | null> {
    console.log(`Intentando obtener datos desde la ruta: ${path}`);
    return this.db.object<T>(path).query.once('value').then(snapshot => {
      console.log(`Datos obtenidos desde ${path}:`, snapshot.val());
      return snapshot.val();
    }).catch(error => {
      console.error(`Error al obtener datos desde ${path}:`, error);
      throw error;
    });
  }
  
  
  // Usamos `update` si los datos existen, para no sobrescribir la ruta
  addData(path: string, data: any) {
    console.log(`Guardando datos en Firebase en la ruta: ${path}`);
    return this.db.object(path).update(data); // Usa update para agregar sin sobrescribir
  }

   // Alternativamente, puedes usar `set` si es un nodo nuevo
   setData(path: string, data: any) {
    console.log(`Creando datos en Firebase en la ruta: ${path}`);
    return this.db.object(path).set(data); // Usa set si es un nodo nuevo
  }

  // Registrar elementos en una lista
  pushData(path: string, data: any): Promise<void> {
    return this.db.list(path).push(data).then(() => {});
  }

  getDatabaseRef(path: string) {
    console.log('Obteniendo referencia de la base de datos:', path);
    const ref = this.db.database.ref(path);
    console.log('Referencia obtenida:', ref);
    return ref;
  }

  updateData(path: string, data: any): Promise<void> {
    return this.db.object(path).update(data);
  }
  
  
  // Eliminar datos
  deleteData(path: string): Promise<void> {
    return this.db.object(path).remove();
  }

  
}
