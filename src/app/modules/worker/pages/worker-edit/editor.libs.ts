// Keep spacing in this file

interface EnvValue {
  key: string;
  type: 'var' | 'secret' | 'assets' | 'storage' | 'kv' | 'database';
}

export function createEnvironmentLib(values: EnvValue[]) {
  if (!values.length) {
    return `declare var env: {};`;
  }

  const members = values.map((v) => {
    switch (v.type) {
      case 'assets':
        return `readonly ${v.key}: BindingAssets`;
      case 'storage':
        return `readonly ${v.key}: BindingStorage`;
      case 'kv':
        return `readonly ${v.key}: BindingKV`;
      case 'database':
        return `readonly ${v.key}: BindingDatabase`;
      default:
        return `readonly ${v.key}: string`;
    }
  });

  return `
interface BindingAssets {
  fetch(path: string, options?: RequestInit): Promise<Response>;
}

interface StorageHeadResult {
  size: number;
  etag?: string;
}

interface StorageListOptions {
  prefix?: string;
  limit?: number;
}

interface StorageListResult {
  keys: string[];
  truncated: boolean;
}

interface BindingStorage {
  get(key: string): Promise<string | null>;
  put(key: string, value: string | Uint8Array): Promise<void>;
  head(key: string): Promise<StorageHeadResult>;
  list(options?: StorageListOptions): Promise<StorageListResult>;
  delete(key: string): Promise<void>;
}

interface KVPutOptions {
  expiresIn?: number;
}

interface KVListOptions {
  prefix?: string;
  limit?: number;
}

interface BindingKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: KVPutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVListOptions): Promise<string[]>;
}

interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

interface BindingDatabase {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
}

interface Environment {
  ${members.join(';\n  ')}
}

declare var env: Environment;`;
}

export const scheduledLib = `
interface ScheduledEvent {
  waitUntil: (handler: Promise<any>) => void;
  scheduledTime: number;
}

declare function addEventListener(type: 'scheduled', listener: (event: ScheduledEvent) => void);
`;
