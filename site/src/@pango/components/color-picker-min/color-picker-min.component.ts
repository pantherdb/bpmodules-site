import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'pango-color-picker-min',
  templateUrl: './color-picker-min.component.html',
  styleUrls: ['./color-picker-min.component.scss']
})
export class ColorPickerMinComponent {
  @Input() selectedColor: string;
  @Input() colors: string[] = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000000', '#FFFFFF', '#A52A2A', '#A9A9A9'];
  @Output() colorChange = new EventEmitter<string>();


  selectColor(color: string): void {
    this.selectedColor = color;
    this.colorChange.emit(this.selectedColor);
  }
}
