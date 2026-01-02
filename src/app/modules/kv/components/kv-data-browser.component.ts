import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, Subject, debounceTime, distinctUntilChanged, merge, switchMap, tap } from 'rxjs';
import { KvDataService, KvDataItem, KvDataListResponse } from '~/app/services/kv-data.service';

@Component({
  selector: 'app-kv-data-browser',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kv-data-browser.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KvDataBrowserComponent implements OnInit {
  @Input({ required: true }) namespaceId!: string;

  private readonly refresh$ = new BehaviorSubject<{ cursor?: string }>({});
  private readonly search$ = new Subject<string>();

  public readonly data$: Observable<KvDataListResponse>;
  public items: KvDataItem[] = [];
  public cursor: string | null = null;
  public hasMore = false;

  public searchPrefix = '';
  public editingItem: { key: string; value: string; expiresIn: number | null; isNew: boolean } | null = null;
  public deleteConfirm: string | null = null;

  constructor(
    private kvDataService: KvDataService,
    private cdr: ChangeDetectorRef
  ) {
    const debouncedSearch$ = this.search$.pipe(debounceTime(300), distinctUntilChanged());

    this.data$ = merge(this.refresh$, debouncedSearch$.pipe(tap(() => (this.cursor = null)))).pipe(
      switchMap(() =>
        this.kvDataService
          .list(this.namespaceId, {
            prefix: this.searchPrefix || undefined,
            cursor: this.cursor ?? undefined,
            limit: 50
          })
          .pipe(
            tap((res) => {
              if (!this.cursor) {
                this.items = res.items;
              } else {
                this.items = [...this.items, ...res.items];
              }

              this.cursor = res.cursor;
              this.hasMore = res.hasMore;
              this.cdr.markForCheck();
            })
          )
      )
    );
  }

  ngOnInit() {
    // Initial load triggered by template subscription
  }

  onSearchChange(value: string) {
    this.search$.next(value);
  }

  loadMore() {
    if (this.cursor) {
      this.refresh$.next({});
    }
  }

  openNew() {
    this.editingItem = { key: '', value: '', expiresIn: null, isNew: true };
  }

  openEdit(item: KvDataItem) {
    const valueStr = typeof item.value === 'string' ? item.value : JSON.stringify(item.value, null, 2);
    this.editingItem = { key: item.key, value: valueStr, expiresIn: null, isNew: false };
  }

  closeEdit() {
    this.editingItem = null;
  }

  save() {
    if (!this.editingItem) return;

    // Try to parse as JSON, fallback to string
    let value: unknown = this.editingItem.value;

    try {
      value = JSON.parse(this.editingItem.value);
    } catch {
      // Keep as string if not valid JSON
    }

    this.kvDataService
      .put(this.namespaceId, this.editingItem.key, value, this.editingItem.expiresIn ?? undefined)
      .subscribe({
        next: () => {
          this.closeEdit();
          this.cursor = null;
          this.refresh$.next({});
        },
        error: (err) => {
          console.error('Failed to save:', err);
        }
      });
  }

  confirmDelete(key: string) {
    this.deleteConfirm = key;
  }

  cancelDelete() {
    this.deleteConfirm = null;
  }

  doDelete() {
    if (!this.deleteConfirm) return;

    this.kvDataService.delete(this.namespaceId, this.deleteConfirm).subscribe({
      next: () => {
        this.deleteConfirm = null;
        this.cursor = null;
        this.refresh$.next({});
      },
      error: (err) => {
        console.error('Failed to delete:', err);
      }
    });
  }

  formatValue(value: unknown, maxLength = 100): string {
    const str = typeof value === 'string' ? value : JSON.stringify(value);

    if (str.length <= maxLength) return str;

    return str.slice(0, maxLength) + '...';
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  }
}
