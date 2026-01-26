import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Resolved } from '~/app/interfaces/resolved';
import { SharedModule } from '~/app/shared/shared.module';
import { DatabasesService } from '~/services/databases.service';
import { DatabaseTokensService, IDatabaseToken, DatabaseOperation } from '~/services/database-tokens.service';
import { TableBrowserComponent } from '../../components/table-browser/table-browser.component';
import { SqlConsoleComponent } from '../../components/sql-console/sql-console.component';
import type { IDatabase } from '@openworkers/api-types';

@Component({
  standalone: true,
  imports: [SharedModule, TableBrowserComponent, SqlConsoleComponent, FormsModule],
  templateUrl: './database-overview.page.html'
})
export default class DatabaseOverviewPage implements OnInit, OnDestroy {
  public readonly database$: Observable<IDatabase>;
  public databaseId: string;

  // Token management
  public readonly tokens$: Observable<IDatabaseToken[]>;
  public readonly creating$ = new BehaviorSubject<boolean>(false);

  public showCreateToken = false;
  public newTokenName = '';
  public newTokenOps: Record<DatabaseOperation, boolean> = {
    SELECT: true,
    INSERT: true,
    UPDATE: true,
    DELETE: true,
    CREATE: false,
    ALTER: false,
    DROP: false
  };
  public newToken: string | null = null;

  public readonly allOperations: DatabaseOperation[] = [
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'CREATE',
    'ALTER',
    'DROP'
  ];

  constructor(
    route: ActivatedRoute,
    private dbs: DatabasesService,
    private tokensService: DatabaseTokensService
  ) {
    const db = route.parent?.snapshot.data['database'] as Resolved<IDatabase>;
    this.databaseId = db.id;

    // Subscribe to the cached observable to get live updates
    this.database$ = db.asObservable?.() ?? this.dbs.findById(db.id);
    this.tokens$ = this.tokensService.tokens$;
  }

  ngOnInit() {
    this.tokensService.loadTokens(this.databaseId).subscribe();
  }

  ngOnDestroy() {
    this.tokensService.clearTokens();
  }

  createToken() {
    if (!this.newTokenName) return;

    const allowedOperations = this.allOperations.filter((op) => this.newTokenOps[op]);

    if (allowedOperations.length === 0) return;

    this.creating$.next(true);
    this.tokensService.createToken(this.databaseId, { name: this.newTokenName, allowedOperations }).subscribe({
      next: (token) => {
        this.newToken = token.token;
        this.showCreateToken = false;
        this.newTokenName = '';
        this.resetTokenOps();
        this.creating$.next(false);
      },
      error: () => {
        this.creating$.next(false);
      }
    });
  }

  cancelCreate() {
    this.showCreateToken = false;
    this.newTokenName = '';
    this.resetTokenOps();
  }

  private resetTokenOps() {
    this.newTokenOps = {
      SELECT: true,
      INSERT: true,
      UPDATE: true,
      DELETE: true,
      CREATE: false,
      ALTER: false,
      DROP: false
    };
  }

  copyToken() {
    if (this.newToken) {
      navigator.clipboard.writeText(this.newToken);
    }
  }

  deleteToken(tokenId: string) {
    if (confirm('Are you sure you want to delete this token?')) {
      this.tokensService.deleteToken(this.databaseId, tokenId).subscribe();
    }
  }
}
