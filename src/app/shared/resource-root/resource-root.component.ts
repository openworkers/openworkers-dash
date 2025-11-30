import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IResource } from '@openworkers/api-types';
import { EditableComponent } from '../editable/editable.component';
import { ModalComponent } from '../modal/modal.component';
import { SharedModule } from '../shared.module';

@Component({
  imports: [ModalComponent, CommonModule, SharedModule, EditableComponent, RouterModule],
  selector: 'app-resource-root',
  templateUrl: 'resource-root.component.html',
  standalone: true
})
export class ResourceRootComponent<T extends IResource> {
  @Input()
  resource!: T;

  @Input()
  resourceName = 'Resource';

  @Input()
  menuLinks?: string[];

  @Output()
  update = new EventEmitter<Partial<IResource>>();

  @Output()
  delete = new EventEmitter<boolean>();

  public readonly open = new EventEmitter<boolean>();
}
