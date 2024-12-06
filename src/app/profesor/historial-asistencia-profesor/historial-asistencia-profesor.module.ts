import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistorialAsistenciaProfesorPageRoutingModule } from './historial-asistencia-profesor-routing.module';

import { HistorialAsistenciaProfesorPage } from './historial-asistencia-profesor.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistorialAsistenciaProfesorPageRoutingModule
  ],
  declarations: [HistorialAsistenciaProfesorPage]
})
export class HistorialAsistenciaProfesorPageModule {}
