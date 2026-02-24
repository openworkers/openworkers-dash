import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormErrorComponent } from '~/app/modules/form-error/form-error.component';
import { visibleBlockValidator } from '~/app/utils/validators';
import { DatabasesService } from '~/services/databases.service';
import { PlanetScaleService } from '~/services/planetscale.service';
import { SharedModule } from '~/app/shared/shared.module';

interface NamedItem {
  id: string;
  name: string;
}

@Component({
  standalone: true,
  imports: [SharedModule, FormErrorComponent],
  templateUrl: './planetscale-connect.page.html'
})
export default class PlanetScaleConnectPage {
  public readonly form: FormGroup;

  public readonly loading = signal(true);
  public readonly error = signal<string | null>(null);
  public readonly step = signal<'exchanging' | 'org' | 'database' | 'branch' | 'name'>('exchanging');

  public readonly organizations = signal<NamedItem[]>([]);
  public readonly databases = signal<NamedItem[]>([]);
  public readonly branches = signal<NamedItem[]>([]);

  public readonly selectedOrg = signal<string | null>(null);
  public readonly selectedDb = signal<string | null>(null);
  public readonly selectedBranch = signal<string | null>(null);

  constructor(
    private readonly ps: PlanetScaleService,
    private readonly dbs: DatabasesService,
    private readonly router: Router,
    route: ActivatedRoute
  ) {
    this.form = new FormGroup({
      dbName: new FormControl('postgres', [Validators.required, Validators.maxLength(100)]),
      name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      desc: new FormControl('', [visibleBlockValidator, Validators.maxLength(255)])
    });

    const code = route.snapshot.queryParamMap.get('code');

    if (!code) {
      this.error.set('Missing authorization code. Please try connecting again.');
      this.loading.set(false);
      return;
    }

    this.exchangeAndLoad(code);
  }

  private async exchangeAndLoad(code: string): Promise<void> {
    try {
      await firstValueFrom(this.ps.exchangeCode(code));
      this.step.set('org');

      const orgs = await firstValueFrom(this.ps.listOrganizations());
      this.organizations.set(orgs);
      this.loading.set(false);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to connect to PlanetScale');
      this.loading.set(false);
    }
  }

  public async selectOrg(orgName: string): Promise<void> {
    this.selectedOrg.set(orgName);
    this.selectedDb.set(null);
    this.selectedBranch.set(null);
    this.databases.set([]);
    this.branches.set([]);
    this.loading.set(true);

    try {
      const dbs = await firstValueFrom(this.ps.listDatabases(orgName));
      this.databases.set(dbs);
      this.step.set('database');
      this.loading.set(false);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load databases');
      this.loading.set(false);
    }
  }

  public async selectDb(dbName: string): Promise<void> {
    this.selectedDb.set(dbName);
    this.selectedBranch.set(null);
    this.branches.set([]);
    this.loading.set(true);

    try {
      const branches = await firstValueFrom(this.ps.listBranches(this.selectedOrg()!, dbName));
      this.branches.set(branches);
      this.step.set('branch');
      this.loading.set(false);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load branches');
      this.loading.set(false);
    }
  }

  public selectBranch(branchName: string): void {
    this.selectedBranch.set(branchName);
    this.step.set('name');

    if (!this.form.get('name')?.value) {
      this.form.get('name')?.setValue(`${this.selectedDb()}-${branchName}`);
    }
  }

  public async submitForm(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    const { dbName, name, desc } = this.form.value;

    try {
      const db = await firstValueFrom(
        this.dbs.create({
          provider: 'planetscale',
          name,
          desc: desc || undefined,
          org: this.selectedOrg()!,
          database: this.selectedDb()!,
          branch: this.selectedBranch()!,
          dbName
        } as any)
      );

      await this.router.navigate(['/database', db.id]);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to create database');
      this.loading.set(false);
    }
  }
}
