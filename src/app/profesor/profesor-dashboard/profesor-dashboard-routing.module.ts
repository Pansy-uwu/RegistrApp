import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProfesorDashboardPage } from './profesor-dashboard.page';

const routes: Routes = [
  {
    path: '',
    component: ProfesorDashboardPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfesorDashboardPageRoutingModule {}
