import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'alumno-dashboard',
    loadChildren: () => import('./alumno/alumno-dashboard/alumno-dashboard.module').then( m => m.AlumnoDashboardPageModule)
  },
  {
    path: 'historial-asistencia-alumno',
    loadChildren: () => import('./alumno/historial-asistencia-alumno/historial-asistencia-alumno.module').then( m => m.HistorialAsistenciaAlumnoPageModule)
  },
  {
    path: 'profesor-dashboard',
    loadChildren: () => import('./profesor/profesor-dashboard/profesor-dashboard.module').then( m => m.ProfesorDashboardPageModule)
  },
  {
    path: 'historial-asistencia-profesor',
    loadChildren: () => import('./profesor/historial-asistencia-profesor/historial-asistencia-profesor.module').then( m => m.HistorialAsistenciaProfesorPageModule)
  },
  {
    path: 'generate-qr',
    loadChildren: () => import('./profesor/generate-qr/generate-qr.module').then( m => m.GenerateQrPageModule)
  },
  {
    path: 'crear-asignatura',
    loadChildren: () => import('./profesor/crear-asignatura/crear-asignatura.module').then( m => m.CrearAsignaturaPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },  {
    path: 'modificar-asignatura',
    loadChildren: () => import('./profesor/modificar-asignatura/modificar-asignatura.module').then( m => m.ModificarAsignaturaPageModule)
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
