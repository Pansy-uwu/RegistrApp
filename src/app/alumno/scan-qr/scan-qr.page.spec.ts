import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScanQrPage } from './scan-qr.page';

describe('ScanQrPage', () => {
  let component: ScanQrPage;
  let fixture: ComponentFixture<ScanQrPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanQrPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
