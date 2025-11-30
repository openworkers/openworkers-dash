import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Router, ActivatedRoute, Event, NavigationEnd } from '@angular/router';
import { filter, map, mergeMap, shareReplay } from 'rxjs/operators';
import { IRouteData } from '~/app/interfaces/route-data';

@Injectable({ providedIn: 'root' })
export class RouterDataService {
  public readonly data$: Observable<IRouteData>;

  constructor(router: Router, activatedRoute: ActivatedRoute) {
    this.data$ = router.events.pipe(
      filter((input: Event): input is NavigationEnd => input instanceof NavigationEnd),
      map(() => activatedRoute),
      map((route) => {
        while (route.firstChild) {
          // biome-ignore lint/style/noParameterAssign: <explanation>
          route = route.firstChild;
        }

        return route;
      }),
      filter((route) => route.outlet === 'primary'),
      mergeMap((route) => route.data),
      shareReplay(1)
    );
  }
}
