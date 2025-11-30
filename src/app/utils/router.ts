import { ValueProvider } from '@angular/core';
import { ROUTES, Routes } from '@angular/router';

interface RoutesProvider extends ValueProvider {
  provide: typeof ROUTES;
  useValue: Routes;
}

export function provideRoutes(routes: Routes): RoutesProvider {
  return { provide: ROUTES, useValue: routes };
}
