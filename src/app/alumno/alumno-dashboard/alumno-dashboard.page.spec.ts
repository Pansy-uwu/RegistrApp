import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlumnoDashboardPage } from './alumno-dashboard.page';

describe('AlumnoDashboardPage', () => {
  let component: AlumnoDashboardPage;
  let fixture: ComponentFixture<AlumnoDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AlumnoDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
