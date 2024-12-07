import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GenerateQrPageRoutingModule } from './generate-qr-routing.module';

import { GenerateQrPage } from './generate-qr.page';


import { QrCodeModule } from 'ng-qrcode'; // Importa QrCodeModule
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GenerateQrPageRoutingModule,
    QrCodeModule // Asegúrate de incluirlo aquí
  ],
  declarations: [GenerateQrPage]
})
export class GenerateQrPageModule {}
