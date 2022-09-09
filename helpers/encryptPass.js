import { workerData, parentPort } from 'worker_threads';
import bcrypt from 'bcryptjs';
import { SALT } from '../config/config.js';

console.log(workerData);
const password = await bcrypt.hash(workerData, SALT);

parentPort.postMessage(password);
