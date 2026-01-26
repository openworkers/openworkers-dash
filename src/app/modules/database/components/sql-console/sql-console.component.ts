import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { DatabaseTokensService, IExecResult } from '~/services/database-tokens.service';

type ResultTab = 'table' | 'json';

@Component({
  selector: 'app-sql-console',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sql-console.component.html'
})
export class SqlConsoleComponent {
  @Input({ required: true }) databaseId!: string;

  public sqlQuery = '';
  public sqlResult: IExecResult | null = null;
  public sqlError: string | null = null;
  public executing$ = new BehaviorSubject<boolean>(false);
  public activeTab: ResultTab = 'table';
  public showHelp = false;

  public readonly shortcuts = [
    { label: 'List tables', query: "SELECT * FROM postgate_helpers.list_tables()" },
    { label: 'Describe table', query: "SELECT * FROM postgate_helpers.describe_table('TABLE_NAME')" }
  ];

  constructor(private tokensService: DatabaseTokensService) {}

  executeQuery() {
    if (!this.sqlQuery.trim()) return;

    this.executing$.next(true);
    this.sqlResult = null;
    this.sqlError = null;

    this.tokensService.exec(this.databaseId, this.sqlQuery).subscribe({
      next: (result) => {
        this.sqlResult = result;
        this.executing$.next(false);
      },
      error: (err) => {
        this.sqlError = err.error?.error || err.message || 'Query failed';
        this.executing$.next(false);
      }
    });
  }

  clearResult() {
    this.sqlResult = null;
    this.sqlError = null;
  }

  getColumns(): string[] {
    if (!this.sqlResult?.rows?.length) return [];
    return Object.keys(this.sqlResult.rows[0]);
  }

  getCellValue(row: Record<string, unknown>, key: string): unknown {
    return row[key];
  }

  formatJson(): string {
    if (!this.sqlResult) return '';
    return JSON.stringify(this.sqlResult, null, 2);
  }

  useShortcut(query: string) {
    this.sqlQuery = query;
  }
}
