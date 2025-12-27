import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Resolved } from '~/app/interfaces/resolved';
import { SharedModule } from '~/app/shared/shared.module';
import { StorageService } from '~/services/storage.service';
import type { IStorageConfig } from '@openworkers/api-types';

@Component({
  standalone: true,
  imports: [SharedModule],
  templateUrl: './storage-overview.page.html'
})
export default class StorageOverviewPage {
  public readonly storage$: Observable<IStorageConfig>;

  constructor(
    route: ActivatedRoute,
    private storageService: StorageService
  ) {
    const storage = route.parent?.snapshot.data['storage'] as Resolved<IStorageConfig>;

    // Subscribe to the cached observable to get live updates
    this.storage$ = storage.asObservable?.() ?? this.storageService.findById(storage.id);
  }
}
