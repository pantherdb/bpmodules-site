import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorPickerMinComponent } from './color-picker-min.component';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [
    ColorPickerMinComponent,
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
  ],
  exports: [
    ColorPickerMinComponent,
  ],
})
export class PangoColorPickerMinModule { }
