import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface PlanetScaleOrganization {
  id: string;
  name: string;
}

interface PlanetScaleDatabase {
  id: string;
  name: string;
}

interface PlanetScaleBranch {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class PlanetScaleService {
  constructor(private http: HttpClient) {}

  exchangeCode(code: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>('/api/v1/planetscale/exchange', { code });
  }

  listOrganizations(): Observable<PlanetScaleOrganization[]> {
    return this.http.get<PlanetScaleOrganization[]>('/api/v1/planetscale/organizations');
  }

  listDatabases(org: string): Observable<PlanetScaleDatabase[]> {
    return this.http.get<PlanetScaleDatabase[]>('/api/v1/planetscale/databases', { params: { org } });
  }

  listBranches(org: string, db: string): Observable<PlanetScaleBranch[]> {
    return this.http.get<PlanetScaleBranch[]>('/api/v1/planetscale/branches', { params: { org, db } });
  }
}
