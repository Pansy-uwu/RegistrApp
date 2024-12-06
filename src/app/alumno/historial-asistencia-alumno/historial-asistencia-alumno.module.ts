import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistorialAsistenciaAlumnoPageRoutingModule } from './historial-asistencia-alumno-routing.module';

import { HistorialAsistenciaAlumnoPage } from './historial-asistencia-alumno.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistorialAsistenciaAlumnoPageRoutingModule
  ],
  declarations: [HistorialAsistenciaAlumnoPage]
})
export class HistorialAsistenciaAlumnoPageModule {}
