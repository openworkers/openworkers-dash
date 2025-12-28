import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ModalComponent } from '~/app/shared/modal/modal.component';
import { TablesService } from '~/app/services/tables.service';
import type { IColumnDefinition } from '@openworkers/api-types';

const COMMON_TYPES = ['TEXT', 'INTEGER', 'BIGINT', 'SERIAL', 'BOOLEAN', 'TIMESTAMPTZ', 'UUID', 'JSONB', 'NUMERIC', 'REAL'];

@Component({
  standalone: true,
  selector: 'app-create-table-modal',
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './create-table-modal.component.html'
})
export class CreateTableModalComponent {
  @Input() open = false;
  @Input({ required: true }) databaseId!: string;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() created = new EventEmitter<void>();

  tableName = '';
  columns = signal<IColumnDefinition[]>([{ name: 'id', type: 'SERIAL', primaryKey: true }]);
  isCreating = signal(false);
  error = signal<string | null>(null);

  commonTypes = COMMON_TYPES;

  constructor(private tablesService: TablesService) {}

  addColumn() {
    this.columns.update((cols) => [...cols, { name: '', type: 'TEXT' }]);
  }

  removeColumn(index: number) {
    this.columns.update((cols) => cols.filter((_, i) => i !== index));
  }

  updateColumn(index: number, field: keyof IColumnDefinition, value: any) {
    this.columns.update((cols) => {
      const updated = [...cols];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  async createTable() {
    if (!this.tableName.trim() || this.columns().length === 0) {
      this.error.set('Table name and at least one column are required');
      return;
    }

    // Validate column names
    const invalidCol = this.columns().find((c) => !c.name.trim());

    if (invalidCol) {
      this.error.set('All columns must have a name');
      return;
    }

    this.isCreating.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(
        this.tablesService.createTable(this.databaseId, {
          name: this.tableName.trim(),
          columns: this.columns()
        })
      );

      this.reset();
      this.created.emit();
    } catch (err) {
      console.error('Failed to create table:', err);
      this.error.set(err instanceof Error ? err.message : 'Failed to create table');
    } finally {
      this.isCreating.set(false);
    }
  }

  reset() {
    this.tableName = '';
    this.columns.set([{ name: 'id', type: 'SERIAL', primaryKey: true }]);
    this.error.set(null);
  }

  close() {
    this.reset();
    this.openChange.emit(false);
  }
}
