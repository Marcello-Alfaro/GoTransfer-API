import { Worker } from 'worker_threads';

export default (script, workerData) => {
  return new Promise((res, rej) => {
    const worker = new Worker(script, { workerData });
    worker.on('message', res);
    worker.on('error', rej);
    worker.on('exit', (code) => {
      if (code !== 0) rej(new Error(`Execution stopped with exit code ${code}`));
    });
  });
};
