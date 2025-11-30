import { Component, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { Resolved } from '~/app/interfaces/resolved';
import { SharedModule } from '~/app/shared/shared.module';
import { ModalComponent } from '~/app/shared/modal/modal.component';
import { DatabasesService } from '~/services/databases.service';
import type { IDatabase } from '@openworkers/api-types';

@Component({
  standalone: true,
  imports: [SharedModule, ModalComponent],
  templateUrl: './database-overview.page.html'
})
export default class DatabaseOverviewPage {
  public readonly database$: Observable<IDatabase>;
  public databaseId: string;

  public showTokenModal = signal(false);
  public generatedToken = signal('');
  public tokenCopied = signal(false);
  public isRegenerating = signal(false);

  constructor(
    route: ActivatedRoute,
    private dbs: DatabasesService
  ) {
    const db = route.parent?.snapshot.data['database'] as Resolved<IDatabase>;
    this.databaseId = db.id;

    // Subscribe to the cached observable to get live updates
    this.database$ = db.asObservable?.() ?? this.dbs.findById(db.id);
  }

  public async regenerateToken(): Promise<void> {
    if (this.isRegenerating()) return;

    this.isRegenerating.set(true);
    try {
      const result = await firstValueFrom(this.dbs.regenerateToken(this.databaseId));
      this.generatedToken.set(result.token);
      this.showTokenModal.set(true);
    } catch (error) {
      console.error('Failed to regenerate token:', error);
    } finally {
      this.isRegenerating.set(false);
    }
  }

  public async copyToken(): Promise<void> {
    await navigator.clipboard.writeText(this.generatedToken());
    this.tokenCopied.set(true);
    setTimeout(() => this.tokenCopied.set(false), 2000);
  }

  public closeTokenModal(): void {
    this.showTokenModal.set(false);
    this.generatedToken.set('');
    this.tokenCopied.set(false);
  }
}
