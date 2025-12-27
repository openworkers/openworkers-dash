import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, firstValueFrom, Observable, Subject, switchMap, startWith, catchError, of, map, scan } from 'rxjs';
import { Resolved } from '~/app/interfaces/resolved';
import { SharedModule } from '~/app/shared/shared.module';
import { StorageService } from '~/services/storage.service';
import type { IStorageConfig } from '@openworkers/api-types';

type UploadState = 'idle' | 'hashing' | 'signing' | 'uploading' | 'success' | 'error';

interface PresignResponse {
  url: string;
  key: string;
}

interface StorageFile {
  key: string;
  size: number;
  lastModified: string;
}

interface FilesResponse {
  files: StorageFile[];
  cursor: string | null;
}

function hexToBase64(hex: string): string {
  return btoa(
    hex
      .match(/\w{2}/g)!
      .map((byte) => String.fromCharCode(parseInt(byte, 16)))
      .join('')
  );
}

@Component({
  standalone: true,
  imports: [SharedModule],
  templateUrl: './storage-overview.page.html'
})
export default class StorageOverviewPage {
  public readonly storage$: Observable<IStorageConfig>;
  public readonly uploadState$ = new BehaviorSubject<UploadState>('idle');
  public uploadError: string | null = null;
  public uploadedKey: string | null = null;
  public selectedFile: File | null = null;

  // File browser state
  private readonly refreshFiles$ = new BehaviorSubject<void>(undefined);
  public readonly filesState$: Observable<{
    files: StorageFile[];
    loading: boolean;
    error: string | null;
    cursor: string | null;
  }>;

  private storageId: string;

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

  refreshFiles() {
    this.refreshFiles$.next();
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.uploadState$.next('idle');
      this.uploadError = null;
      this.uploadedKey = null;
    }
  }

  async upload() {
    if (!this.selectedFile) return;

    const file = this.selectedFile;

    // 100MB limit
    if (file.size > 100 * 1024 * 1024) {
      this.uploadError = 'File too large. Maximum size is 100MB.';
      this.uploadState$.next('error');
      return;
    }

    try {
      // 1. Hash the file
      this.uploadState$.next('hashing');
      const checksum = await this.computeSha256(file);

      // 2. Get presigned URL
      this.uploadState$.next('signing');
      const presignResponse = await firstValueFrom(
        this.http.post<PresignResponse>(`/api/v1/storage/${this.storageId}/presign`, {
          filename: file.name.replace(/[^a-z0-9.-]/gi, '_'),
          filesize: file.size,
          filetype: file.type || 'application/octet-stream',
          checksum
        })
      );

      // 3. Upload directly to S3/R2
      this.uploadState$.next('uploading');
      await firstValueFrom(
        this.http.put(presignResponse.url, file, {
          headers: {
            'x-amz-checksum-sha256': checksum
          }
        })
      );

      // Success
      this.uploadedKey = presignResponse.key;
      this.uploadState$.next('success');
      this.selectedFile = null;

      // Refresh file list
      this.refreshFiles$.next();
    } catch (err) {
      console.error('Upload failed:', err);
      this.uploadError = err instanceof Error ? err.message : 'Upload failed';
      this.uploadState$.next('error');
    }
  }

  private async computeSha256(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    const hex = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hexToBase64(hex);
  }

  resetUpload() {
    this.selectedFile = null;
    this.uploadState$.next('idle');
    this.uploadError = null;
    this.uploadedKey = null;
  }
}
