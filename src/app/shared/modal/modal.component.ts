import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
  imports: [CommonModule],
  standalone: true
})
export class ModalComponent {
  @Input()
  public closable = true;

  // Two-way binding to "open"
  @Input() open = false; // External open change
  @Output() openChange = new EventEmitter<boolean>();

  @Input()
  variant: 'small' | 'large' | 'none' = 'small';
}
