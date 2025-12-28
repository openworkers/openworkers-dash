import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Resolved } from '~/app/interfaces/resolved';
import { SharedModule } from '~/app/shared/shared.module';
import { DatabasesService } from '~/services/databases.service';
import { TableBrowserComponent } from '../../components/table-browser/table-browser.component';
import type { IDatabase } from '@openworkers/api-types';

@Component({
  standalone: true,
  imports: [SharedModule, TableBrowserComponent],
  templateUrl: './database-overview.page.html'
})
export default class DatabaseOverviewPage {
  public readonly database$: Observable<IDatabase>;
  public databaseId: string;

  constructor(
    route: ActivatedRoute,
    private dbs: DatabasesService
  ) {
    const db = route.parent?.snapshot.data['database'] as Resolved<IDatabase>;
    this.databaseId = db.id;

    // Subscribe to the cached observable to get live updates
    this.database$ = db.asObservable?.() ?? this.dbs.findById(db.id);
  }
}
