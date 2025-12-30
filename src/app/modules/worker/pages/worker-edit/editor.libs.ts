// OpenWorkers Monaco Editor Type Libraries

interface EnvValue {
  key: string;
  type: 'var' | 'secret' | 'assets' | 'storage' | 'kv' | 'database' | 'worker';
}

// Type files to load from assets/workers-types/
const TYPE_FILES = [
  'events.d.ts',
  'abort.d.ts',
  'streams.d.ts',
  'blob.d.ts',
  'url.d.ts',
  'fetch.d.ts',
  'encoding.d.ts',
  'crypto.d.ts',
  'console.d.ts',
  'timers.d.ts',
  'workers.d.ts',
  'bindings.d.ts'
];

// Fetch and combine all worker types
export async function loadWorkersTypes(): Promise<string> {
  const contents = await Promise.all(
    TYPE_FILES.map(async (file) => {
      const res = await fetch(`/assets/workers-types/${file}`);
      return res.text();
    })
  );

  return contents.join('\n');
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
      case 'worker':
        return `readonly ${v.key}: BindingWorker`;
      default:
        return `readonly ${v.key}: string`;
    }
  });

  return `
interface Environment {
  ${members.join(';\n  ')}
}

declare var env: Environment;`;
}

export function createEnvType(values: EnvValue[]) {
  if (!values.length) {
    return `type Env = {};`;
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
      case 'worker':
        return `readonly ${v.key}: BindingWorker`;
      default:
        return `readonly ${v.key}: string`;
    }
  });

  return `
type Env = {
  ${members.join(';\n  ')}
};`;
}
