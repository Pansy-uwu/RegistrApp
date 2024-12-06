import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AlumnoDashboardPageRoutingModule } from './alumno-dashboard-routing.module';

import { AlumnoDashboardPage } from './alumno-dashboard.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AlumnoDashboardPageRoutingModule
  ],
  declarations: [AlumnoDashboardPage]
})
export class AlumnoDashboardPageModule {}
