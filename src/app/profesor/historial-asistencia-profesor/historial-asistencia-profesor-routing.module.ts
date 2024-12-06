import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistorialAsistenciaProfesorPage } from './historial-asistencia-profesor.page';

const routes: Routes = [
  {
    path: '',
    component: HistorialAsistenciaProfesorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistorialAsistenciaProfesorPageRoutingModule {}
