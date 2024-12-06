import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProfesorDashboardPageRoutingModule } from './profesor-dashboard-routing.module';

import { ProfesorDashboardPage } from './profesor-dashboard.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProfesorDashboardPageRoutingModule
  ],
  declarations: [ProfesorDashboardPage]
})
export class ProfesorDashboardPageModule {}
