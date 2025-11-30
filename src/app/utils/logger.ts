enum LEVELS {
  trace,
  debug,
  info,
  warn,
  error
}

type Levels = keyof typeof LEVELS;

interface Logger extends Pick<Console, Levels> {
  getLogger: (name: string, level?: LEVELS) => Logger;
}

const storage = (typeof window !== 'undefined' && window.localStorage) || null;

function createLogger(name: string, level: LEVELS = LEVELS.warn): Logger {
  let lvl = level;

  if (storage) {
    const level = storage.getItem(`loglevel:${name}`) as Levels | null;
    if (level) {
      lvl = LEVELS[level];
    } else {
      storage.setItem(`loglevel:${name}`, 'warn');
    }
  }

  return new Proxy(console as any as Logger, {
    get(target, prop) {
      switch (prop) {
        case 'getLogger':
          return (name: string, level?: Levels) => createLogger(name, level && LEVELS[level]);
        case 'trace':
        case 'debug':
        case 'info':
        case 'warn':
        case 'error':
          if (LEVELS[prop] < lvl) {
            return () => {};
          }

          return target[prop];
        default:
          return undefined;
      }
    }
  });
}

export const logger = createLogger('main');
