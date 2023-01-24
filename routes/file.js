import express from 'express';
import authorization from '../middlewares/authorization.js';
import fileController from '../controllers/file.js';

const router = express.Router();

router.get('/transfer/storage-server', authorization, fileController.getTransferFiles);
router.get('/download/:dirId/:fileId', fileController.getFile);
router.get('/download/:dirId', fileController.getAllFiles);

router.post('/upload/allocate-file', fileController.getAllocateFile);
router.put('/upload', fileController.fileHandler, fileController.postSendFile);
router.put('/get-file', authorization, fileController.getFileStorage);

export default router;
