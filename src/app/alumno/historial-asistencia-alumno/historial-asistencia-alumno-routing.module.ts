import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistorialAsistenciaAlumnoPage } from './historial-asistencia-alumno.page';

const routes: Routes = [
  {
    path: '',
    component: HistorialAsistenciaAlumnoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistorialAsistenciaAlumnoPageRoutingModule {}
