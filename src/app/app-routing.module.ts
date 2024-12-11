import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard'; // Importa el guard
import { PageNotFoundComponent } from './page-not-found/page-not-found.component'; // Importa el componente

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full', // Redirige a login por defecto
  },
  {
    path: 'alumno-dashboard',
    loadChildren: () =>
      import('./alumno/alumno-dashboard/alumno-dashboard.module').then(
        (m) => m.AlumnoDashboardPageModule
      ),
    canActivate: [authGuard], // Ruta protegida
  },
  {
    path: 'historial-asistencia-alumno',
    loadChildren: () =>
      import('./alumno/historial-asistencia-alumno/historial-asistencia-alumno.module').then(
        (m) => m.HistorialAsistenciaAlumnoPageModule
      ),
    canActivate: [authGuard], // Ruta protegida
  },
  {
    path: 'profesor-dashboard',
    loadChildren: () =>
      import('./profesor/profesor-dashboard/profesor-dashboard.module').then(
        (m) => m.ProfesorDashboardPageModule
      ),
    canActivate: [authGuard], // Ruta protegida
  },
  {
    path: 'historial-asistencia-profesor',
    loadChildren: () =>
      import('./profesor/historial-asistencia-profesor/historial-asistencia-profesor.module').then(
        (m) => m.HistorialAsistenciaProfesorPageModule
      ),
    canActivate: [authGuard], // Ruta protegida
  },
  {
    path: 'generate-qr',
    loadChildren: () =>
      import('./profesor/generate-qr/generate-qr.module').then(
        (m) => m.GenerateQrPageModule
      ),
    canActivate: [authGuard], // Ruta protegida
  },
  {
    path: 'crear-asignatura',
    loadChildren: () =>
      import('./profesor/crear-asignatura/crear-asignatura.module').then(
        (m) => m.CrearAsignaturaPageModule
      ),
    canActivate: [authGuard], // Ruta protegida
  },
  {
    path: 'modificar-asignatura',
    loadChildren: () =>
      import('./profesor/modificar-asignatura/modificar-asignatura.module').then(
        (m) => m.ModificarAsignaturaPageModule
      ),
    canActivate: [authGuard], // Ruta protegida
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: '**', // Comodín para rutas no encontradas
    component: PageNotFoundComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
