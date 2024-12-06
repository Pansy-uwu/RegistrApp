import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistorialAsistenciaProfesorPage } from './historial-asistencia-profesor.page';

describe('HistorialAsistenciaProfesorPage', () => {
  let component: HistorialAsistenciaProfesorPage;
  let fixture: ComponentFixture<HistorialAsistenciaProfesorPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorialAsistenciaProfesorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
