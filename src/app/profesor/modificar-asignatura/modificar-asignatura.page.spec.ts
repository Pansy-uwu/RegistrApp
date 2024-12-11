import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModificarAsignaturaPage } from './modificar-asignatura.page';

describe('ModificarAsignaturaPage', () => {
  let component: ModificarAsignaturaPage;
  let fixture: ComponentFixture<ModificarAsignaturaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ModificarAsignaturaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
