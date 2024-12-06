import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenerateQrPage } from './generate-qr.page';

describe('GenerateQrPage', () => {
  let component: GenerateQrPage;
  let fixture: ComponentFixture<GenerateQrPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GenerateQrPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
