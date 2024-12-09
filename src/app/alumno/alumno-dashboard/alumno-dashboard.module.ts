import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AlumnoDashboardPageRoutingModule } from './alumno-dashboard-routing.module';

import { AlumnoDashboardPage } from './alumno-dashboard.page';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AlumnoDashboardPageRoutingModule
  ],
  declarations: [AlumnoDashboardPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Agregar esta línea
})
export class AlumnoDashboardPageModule {}
