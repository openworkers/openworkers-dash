import { HttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot } from '@angular/router';
import { IResource } from '@openworkers/api-types';
import { BehaviorSubject, first, map, mergeMap, Observable, tap } from 'rxjs';

const SET = Symbol();
const FULL = '__isFull';

interface Identifiable {
  id: string;
}

type CacheInternal<T> = T & {
  asObservable: () => Observable<T>;
  next: () => void;
  [FULL]: boolean;
  [SET]: true;
};

type CacheExternal<T> = T & {
  [FULL]: boolean;
};

enum Op {
  add,
  del,
  up
}

interface IMessage<T extends Identifiable> {
  op: Op;
  data: CacheExternal<T>;
}

function makeCacheInternal<T extends Identifiable>(obj: T, full: boolean): CacheInternal<T> {
  if (Object.prototype.hasOwnProperty.call(obj, SET)) {
    throw new Error(`${obj.id} is already extended`);
  }

  const subj = new BehaviorSubject(obj);

  Object.defineProperty(obj, SET, { value: true });
  Object.defineProperty(obj, FULL, { value: full, writable: true, enumerable: true });
  Object.defineProperty(obj, 'next', { value: () => subj.next(obj) });
  Object.defineProperty(obj, 'asObservable', { value: () => subj.asObservable() });

  return obj as CacheInternal<T>;
}

export abstract class ResourceService<T extends IResource, C, U extends Identifiable> {
  private readonly com: BroadcastChannel;
  private readonly all$ = new BehaviorSubject<CacheInternal<T>[]>([]);
  private readonly map = new Map<string, CacheInternal<T>>();

  constructor(
    protected http: HttpClient,
    protected base: string
  ) {
    console.log(`Instantiating ${this.base} service`);
    this.com = new BroadcastChannel(`channel:${this.base}`);

    this.com.addEventListener('message', ({ data: { op, data } }: MessageEvent<IMessage<T>>) => {
      const full = data[FULL];
      switch (op) {
        case Op.add:
          this.cacheAndWatch(data, full, false);
          this.refreshAll();
          break;
        case Op.del:
          this.map.delete(data.id);
          this.refreshAll();
          break;
        case Op.up:
          this.cacheAndWatch(data, full, false);
          break;
      }
    });
  }

  public getResourceName(): string {
    return this.base;
  }

  protected cacheAndWatch(obj: T, full = true, emit = true): CacheInternal<T> {
    const object = ((cached: CacheInternal<T> | null) => {
      // Got cached object, merge with updates
      if (cached) {
        console.log('HIT CACHE', obj.id, this.map.size);
        return Object.assign(cached, obj, { [FULL]: full || cached[FULL] });
      }

      // Create cached object
      const created = makeCacheInternal(obj, full);
      this.map.set(created.id, created);
      console.log('BEG CACHE', created.id, this.map.size);
      return created;
    })(this.map.get(obj.id) ?? null);

    if (emit) {
      this.com.postMessage({ op: Op.up, data: object });
    }

    object.next();

    return object;
  }

  public findAll(): Observable<T[]> {
    if (this.all$.value.length) {
      return this.all$;
    }

    console.log('Finding all resources for', this.base);
    return this.http.get<T[]>(`/api/v1/${this.base}`).pipe(
      map((els) => els.map((e) => this.cacheAndWatch(e, false))),
      tap((els) => this.all$.next(els)),
      mergeMap(() => this.all$)
    );
  }

  public findById(id: string): Observable<T> {
    const subj = this.map.get(id);
    if (subj?.[FULL]) {
      return subj.asObservable();
    }

    return this.http.get<T>(`/api/v1/${this.base}/${id}`).pipe(
      map((data) => this.cacheAndWatch(data)),
      mergeMap((data) => data.asObservable())
    );
  }

  public create(input: C): Observable<T> {
    return this.http.post<T>(`/api/v1/${this.base}`, input).pipe(
      map((data) => this.cacheAndWatch(data)),
      mergeMap((data) => data.asObservable()),
      tap(() => this.refreshAll()),
      tap((data) => this.com.postMessage({ op: Op.add, data }))
    );
  }

  public update({ id, ...params }: U): Observable<T> {
    return this.http.patch<T>(`/api/v1/${this.base}/${id}`, params).pipe(
      map((data) => this.cacheAndWatch(data)),
      mergeMap((data) => data.asObservable())
    );
  }

  public delete(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`/api/v1/${this.base}/${id}`).pipe(
      tap(() => this.map.delete(id)),
      tap(() => this.refreshAll()),
      tap(() => this.com.postMessage({ op: Op.del, data: { id } }))
    );
  }

  private refreshAll() {
    // If we already loaded resource list, we can refresh from map
    if (this.all$.value.length) {
      this.all$.next(Array.from(this.map.values()).sort((a, b) => +new Date(b?.createdAt) - +new Date(a?.createdAt)));
    }
  }

  public resolve(route: ActivatedRouteSnapshot): Observable<T> {
    const id = route.paramMap.get('id');

    console.log(`Resolving ${this.base} ${id}`);

    if (!id) {
      throw new Error('Missing id');
    }

    return this.findById(id).pipe(first());
  }
}
