import { workerData, parentPort } from 'worker_threads';
import bcrypt from 'bcryptjs';

const { password, storedPassword } = workerData;

const isValid = await bcrypt.compare(password, storedPassword);

parentPort.postMessage(isValid);
