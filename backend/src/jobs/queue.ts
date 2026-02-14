type JobFn = () => Promise<void>;

const q: JobFn[] = [];
let running = false;

async function runNext() {
  if (running) return;
  const next = q.shift();
  if (!next) return;

  running = true;
  try {
    await next();
  } finally {
    running = false;
    // schedule next tick
    setImmediate(runNext);
  }
}

export function enqueue(fn: JobFn) {
  q.push(fn);
  setImmediate(runNext);
}
