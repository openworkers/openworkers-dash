import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Resolved } from '~/app/interfaces/resolved';
import { SharedModule } from '~/app/shared/shared.module';
import { KvService } from '~/services/kv.service';
import type { IKvNamespace } from '@openworkers/api-types';

@Component({
  standalone: true,
  imports: [SharedModule],
  templateUrl: './kv-overview.page.html'
})
export default class KvOverviewPage {
  public readonly kv$: Observable<IKvNamespace>;

  constructor(
    route: ActivatedRoute,
    private kvService: KvService
  ) {
    const kv = route.parent?.snapshot.data['kv'] as Resolved<IKvNamespace>;

    // Subscribe to the cached observable to get live updates
    this.kv$ = kv.asObservable?.() ?? this.kvService.findById(kv.id);
  }
}
