import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AlumnoDashboardPage } from './alumno-dashboard.page';

const routes: Routes = [
  {
    path: '',
    component: AlumnoDashboardPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AlumnoDashboardPageRoutingModule {}
