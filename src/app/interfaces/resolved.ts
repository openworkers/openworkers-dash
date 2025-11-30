import { Observable } from 'rxjs';

export type Resolved<T> = T & {
  asObservable: () => Observable<T>;
};
