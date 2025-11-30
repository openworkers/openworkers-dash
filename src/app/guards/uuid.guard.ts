import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, CanActivate } from '@angular/router';
import { isUUID } from '../utils/uuid';
import { logger } from '~/logger';

const log = logger.getLogger('UUIDGuard');

@Injectable({ providedIn: 'root' })
export class UUIDGuard implements CanActivate {
  constructor(private router: Router) {}
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const id = route.paramMap.get('id');

    if (typeof id === 'string' && isUUID(id)) {
      return true;
    }

    log.warn('Invalid uuid', id);

    this.router.navigate(['/workers']);

    return false;
  }
}
