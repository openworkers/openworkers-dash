// Keep spacing in this file
export function createEnvironmentLib(keys: string[]) {
  return `
  interface Environment {\n  ${
    keys.length ? keys.map((k) => `readonly ${k}: string`).join(';\n  ') : ''
  }\n}\n\ndeclare var env: ${keys.length ? 'Environment' : '{}'};`;
}

export const scheduledLib = `
interface ScheduledEvent {
  waitUntil: (handler: Promise<any>) => void;
  scheduledTime: number;
}

declare function addEventListener(type: 'scheduled', listener: (event: ScheduledEvent) => void);
`;
