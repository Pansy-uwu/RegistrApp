import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ModificarAsignaturaPageRoutingModule } from './modificar-asignatura-routing.module';

import { ModificarAsignaturaPage } from './modificar-asignatura.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ModificarAsignaturaPageRoutingModule
  ],
  declarations: [ModificarAsignaturaPage]
})
export class ModificarAsignaturaPageModule {}
