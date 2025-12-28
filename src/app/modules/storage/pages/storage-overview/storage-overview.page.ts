import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, firstValueFrom, Observable, switchMap, startWith, catchError, of, map } from 'rxjs';
import { Resolved } from '~/app/interfaces/resolved';
import { SharedModule } from '~/app/shared/shared.module';
import { StorageService } from '~/services/storage.service';
import type { IStorageConfig } from '@openworkers/api-types';

interface StorageFile {
  key: string;
  size: number;
  lastModified: string;
}

interface FilesResponse {
  files: StorageFile[];
  cursor: string | null;
}

@Component({
  standalone: true,
  imports: [SharedModule],
  templateUrl: './storage-overview.page.html'
})
export default class StorageOverviewPage {
  public readonly storage$: Observable<IStorageConfig>;
  public storageId: string;

  // File browser state
  private readonly refreshFiles$ = new BehaviorSubject<void>(undefined);
  public selectedFiles = new Set<string>();
  public readonly filesState$: Observable<{
    files: StorageFile[];
    loading: boolean;
    error: string | null;
    cursor: string | null;
  }>;

  constructor(
    route: ActivatedRoute,
    private storageService: StorageService,
    private http: HttpClient
  ) {
    const storage = route.parent?.snapshot.data['storage'] as Resolved<IStorageConfig>;
    this.storageId = storage.id;

    // Subscribe to the cached observable to get live updates
    this.storage$ = storage.asObservable?.() ?? this.storageService.findById(storage.id);

    // Files observable
    this.filesState$ = this.refreshFiles$.pipe(
      switchMap(() =>
        this.http.get<FilesResponse>(`/api/v1/storage/${this.storageId}/files`).pipe(
          map((response) => ({
            files: response.files,
            loading: false,
            error: null,
            cursor: response.cursor
          })),
          startWith({ files: [], loading: true, error: null, cursor: null }),
          catchError(() => of({ files: [], loading: false, error: 'Failed to load files', cursor: null }))
        )
      )
    );
  }

  onUploaded() {
    this.refreshFiles$.next();
  }

  refreshFiles() {
    this.selectedFiles.clear();
    this.refreshFiles$.next();
  }

  toggleSelect(key: string) {
    if (this.selectedFiles.has(key)) {
      this.selectedFiles.delete(key);
    } else {
      this.selectedFiles.add(key);
    }
  }

  toggleSelectAll(files: StorageFile[]) {
    if (this.selectedFiles.size === files.length) {
      this.selectedFiles.clear();
    } else {
      this.selectedFiles = new Set(files.map((f) => f.key));
    }
  }

  async deleteSelected() {
    const keys = Array.from(this.selectedFiles);

    if (!confirm(`Delete ${keys.length} file(s)?`)) return;

    try {
      await Promise.all(
        keys.map((key) =>
          firstValueFrom(
            this.http.delete(`/api/v1/storage/${this.storageId}/files/${encodeURIComponent(key)}`)
          )
        )
      );
      this.selectedFiles.clear();
      this.refreshFiles$.next();
    } catch (err) {
      console.error('Failed to delete files:', err);
      alert('Failed to delete some files');
    }
  }

  async openFile(key: string) {
    try {
      const response = await firstValueFrom(
        this.http.get<{ url: string }>(`/api/v1/storage/${this.storageId}/files/${encodeURIComponent(key)}/presign`)
      );
      window.open(response.url, '_blank');
    } catch (err) {
      console.error('Failed to get presigned URL:', err);
      alert('Failed to open file');
    }
  }

  async deleteFile(key: string) {
    if (!confirm(`Delete ${key}?`)) return;

    try {
      await firstValueFrom(
        this.http.delete(`/api/v1/storage/${this.storageId}/files/${encodeURIComponent(key)}`)
      );
      this.refreshFiles$.next();
    } catch (err) {
      console.error('Failed to delete file:', err);
      alert('Failed to delete file');
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
}
