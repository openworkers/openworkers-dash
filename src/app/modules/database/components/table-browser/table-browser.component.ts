import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TablesService } from '~/app/services/tables.service';
import type { ITableInfo, IColumnInfo, IColumnDefinition } from '@openworkers/api-types';
import { ModalComponent } from '~/app/shared/modal/modal.component';
import { CreateTableModalComponent } from '../create-table-modal/create-table-modal.component';

const COMMON_TYPES = ['TEXT', 'INTEGER', 'BIGINT', 'SERIAL', 'BOOLEAN', 'TIMESTAMPTZ', 'UUID', 'JSONB', 'NUMERIC', 'REAL'];

@Component({
  standalone: true,
  selector: 'app-table-browser',
  imports: [CommonModule, FormsModule, ModalComponent, CreateTableModalComponent],
  templateUrl: './table-browser.component.html'
})
export class TableBrowserComponent implements OnInit {
  @Input({ required: true }) databaseId!: string;
  @Input() provider: string = 'platform';

  tables = signal<ITableInfo[]>([]);
  selectedTable = signal<string | null>(null);
  selectedColumns = signal<IColumnInfo[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  showCreateModal = signal(false);
  showDeleteConfirm = signal(false);
  tableToDelete = signal<string | null>(null);

  // Add column modal
  showAddColumnModal = signal(false);
  newColumn: IColumnDefinition = { name: '', type: 'TEXT' };
  commonTypes = COMMON_TYPES;

  // Delete column
  showDeleteColumnConfirm = signal(false);
  columnToDelete = signal<string | null>(null);

  constructor(private tablesService: TablesService) {}

  ngOnInit() {
    if (this.provider === 'platform') {
      this.loadTables();
    }
  }

  async loadTables() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const tables = await firstValueFrom(this.tablesService.listTables(this.databaseId));
      this.tables.set(tables);
    } catch (err) {
      this.error.set('Failed to load tables');
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async selectTable(tableName: string) {
    if (this.selectedTable() === tableName) {
      this.selectedTable.set(null);
      this.selectedColumns.set([]);
      return;
    }

    this.selectedTable.set(tableName);

    try {
      const details = await firstValueFrom(this.tablesService.getTable(this.databaseId, tableName));
      this.selectedColumns.set(details.columns);
    } catch (err) {
      console.error('Failed to get table details:', err);
      this.selectedColumns.set([]);
    }
  }

  openCreateModal() {
    this.showCreateModal.set(true);
  }

  onTableCreated() {
    this.showCreateModal.set(false);
    this.loadTables();
  }

  confirmDelete(tableName: string, event: Event) {
    event.stopPropagation();
    this.tableToDelete.set(tableName);
    this.showDeleteConfirm.set(true);
  }

  async deleteTable() {
    const tableName = this.tableToDelete();

    if (!tableName) return;

    try {
      await firstValueFrom(this.tablesService.dropTable(this.databaseId, tableName));

      if (this.selectedTable() === tableName) {
        this.selectedTable.set(null);
        this.selectedColumns.set([]);
      }

      this.loadTables();
    } catch (err) {
      console.error('Failed to delete table:', err);
    } finally {
      this.showDeleteConfirm.set(false);
      this.tableToDelete.set(null);
    }
  }

  // Column management
  openAddColumnModal() {
    this.newColumn = { name: '', type: 'TEXT' };
    this.showAddColumnModal.set(true);
  }

  async addColumn() {
    const tableName = this.selectedTable();

    if (!tableName || !this.newColumn.name.trim()) return;

    try {
      await firstValueFrom(this.tablesService.addColumn(this.databaseId, tableName, this.newColumn));
      this.showAddColumnModal.set(false);

      // Refresh columns
      const details = await firstValueFrom(this.tablesService.getTable(this.databaseId, tableName));
      this.selectedColumns.set(details.columns);
      this.loadTables();
    } catch (err) {
      console.error('Failed to add column:', err);
    }
  }

  confirmDeleteColumn(columnName: string, event: Event) {
    event.stopPropagation();
    this.columnToDelete.set(columnName);
    this.showDeleteColumnConfirm.set(true);
  }

  async deleteColumn() {
    const tableName = this.selectedTable();
    const columnName = this.columnToDelete();

    if (!tableName || !columnName) return;

    try {
      await firstValueFrom(this.tablesService.dropColumn(this.databaseId, tableName, columnName));

      // Refresh columns
      const details = await firstValueFrom(this.tablesService.getTable(this.databaseId, tableName));
      this.selectedColumns.set(details.columns);
      this.loadTables();
    } catch (err) {
      console.error('Failed to delete column:', err);
    } finally {
      this.showDeleteColumnConfirm.set(false);
      this.columnToDelete.set(null);
    }
  }
}
