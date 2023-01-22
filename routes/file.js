import express from 'express';
import isAuth from '../middlewares/isAuth.js';
import fileController from '../controllers/file.js';
import socketId from '../middlewares/socketId.js';

const router = express.Router();

router.get('/transfer/storage-server', isAuth, fileController.getTransferFiles);
router.get('/download/:dirId/:fileId', isAuth, fileController.getFile);
router.get('/download/:dirId', isAuth, fileController.getAllFiles);

router.post('/upload/allocate-file', fileController.getAllocateFile);
router.put('/upload', fileController.fileHandler, fileController.postSendFile);
router.put('/get-file', isAuth, fileController.getFileStorage);

export default router;
