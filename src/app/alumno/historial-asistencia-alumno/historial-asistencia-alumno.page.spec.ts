import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistorialAsistenciaAlumnoPage } from './historial-asistencia-alumno.page';

describe('HistorialAsistenciaAlumnoPage', () => {
  let component: HistorialAsistenciaAlumnoPage;
  let fixture: ComponentFixture<HistorialAsistenciaAlumnoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorialAsistenciaAlumnoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
