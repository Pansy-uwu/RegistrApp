import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ModificarAsignaturaPage } from './modificar-asignatura.page';

const routes: Routes = [
  {
    path: '',
    component: ModificarAsignaturaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ModificarAsignaturaPageRoutingModule {}
