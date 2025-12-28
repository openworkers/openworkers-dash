import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface PresignResponse {
  url: string;
  key: string;
}

interface UploadedFile {
  key: string;
  name: string;
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
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  imports: [CommonModule],
  standalone: true
})
export class FileUploadComponent {
  @Input() storageId!: string;
  @Output() uploaded = new EventEmitter<UploadedFile[]>();

  files: File[] = [];
  isDragging = false;
  isUploading = false;
  uploadedCount = 0;
  currentFile = '';
  error: string | null = null;

  constructor(private http: HttpClient) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const items = event.dataTransfer?.items;

    if (items) {
      this.handleDataTransferItems(items);
    }
  }

  async handleDataTransferItems(items: DataTransferItemList) {
    const filePromises: Promise<File[]>[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry?.();

        if (entry) {
          filePromises.push(this.traverseEntry(entry));
        } else {
          const file = item.getAsFile();

          if (file) {
            filePromises.push(Promise.resolve([file]));
          }
        }
      }
    }

    const filesArrays = await Promise.all(filePromises);
    this.files = filesArrays.flat();
  }

  async traverseEntry(entry: FileSystemEntry, path = ''): Promise<File[]> {
    if (entry.isFile) {
      return new Promise((resolve) => {
        (entry as FileSystemFileEntry).file((file) => {
          // Create a new File with the full path as name
          const fullPath = path ? `${path}/${entry.name}` : entry.name;
          const newFile = new File([file], fullPath, { type: file.type });
          resolve([newFile]);
        });
      });
    } else if (entry.isDirectory) {
      const dirReader = (entry as FileSystemDirectoryEntry).createReader();
      const entries = await new Promise<FileSystemEntry[]>((resolve) => {
        dirReader.readEntries((entries) => resolve(entries));
      });

      const subPath = path ? `${path}/${entry.name}` : entry.name;
      const filesArrays = await Promise.all(entries.map((e) => this.traverseEntry(e, subPath)));
      return filesArrays.flat();
    }

    return [];
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files) {
      this.files = Array.from(input.files).map((file) => {
        // Use webkitRelativePath for folder uploads, otherwise just the name
        const path = (file as any).webkitRelativePath || file.name;
        return new File([file], path, { type: file.type });
      });
    }
  }

  removeFile(index: number) {
    this.files = this.files.filter((_, i) => i !== index);
  }

  clearFiles() {
    this.files = [];
    this.error = null;
  }

  async upload() {
    if (this.files.length === 0) return;

    this.isUploading = true;
    this.uploadedCount = 0;
    this.error = null;

    const uploadedFiles: UploadedFile[] = [];

    try {
      for (const file of this.files) {
        this.currentFile = file.name;

        // 100MB limit per file
        if (file.size > 100 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 100MB.`);
        }

        // Compute SHA-256
        const checksum = await this.computeSha256(file);

        // Get presigned URL
        const presignResponse = await firstValueFrom(
          this.http.post<PresignResponse>(`/api/v1/storage/${this.storageId}/presign`, {
            filename: file.name.replace(/[^a-z0-9./-]/gi, '_'),
            filesize: file.size,
            filetype: file.type || 'application/octet-stream',
            checksum
          })
        );

        // Upload to S3/R2
        await firstValueFrom(
          this.http.put(presignResponse.url, file, {
            headers: {
              'x-amz-checksum-sha256': checksum
            }
          })
        );

        uploadedFiles.push({ key: presignResponse.key, name: file.name });
        this.uploadedCount++;
      }

      this.uploaded.emit(uploadedFiles);
      this.files = [];
      this.currentFile = '';
    } catch (err) {
      console.error('Upload failed:', err);
      this.error = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      this.isUploading = false;
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

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
}
