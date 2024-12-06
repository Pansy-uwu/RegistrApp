import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Importar módulos de Firebase
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { AngularFireAnalyticsModule } from '@angular/fire/compat/analytics';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(), // Inicializa Ionic
    AppRoutingModule,      // Configuración de rutas
    
    // Inicializar Firebase con la configuración del archivo environment
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,       // Módulo para autenticación
    AngularFireDatabaseModule,   // Módulo para Realtime Database
    AngularFireAnalyticsModule   // Módulo para Analytics (opcional)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
