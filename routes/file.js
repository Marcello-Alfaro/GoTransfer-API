import express from 'express';
import isAuth from '../middlewares/isAuth.js';
import fileController from '../controllers/file.js';
import socketId from '../middlewares/socketId.js';

const router = express.Router();

router.get('/transfer/storage-server', isAuth, fileController.getTransferFiles);
router.get('/download/:dirId/:fileId', isAuth, fileController.getFile);
router.get('/download/:dirId', isAuth, fileController.getAllFiles);

router.post('/upload/allocate-file', isAuth, fileController.getAllocateFile);
router.post('/upload', isAuth, socketId, fileController.fileHandler, fileController.postSendFile);
router.post('/get-file', isAuth, fileController.getFileStorage);
router.post('/get-all-files', isAuth, fileController.getAllFilesStorage);

export default router;
