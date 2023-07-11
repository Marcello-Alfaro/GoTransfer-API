import express from 'express';
import authorization from '../middlewares/authorization.js';
import fileController from '../controllers/file.js';
import socketId from '../middlewares/socketId.js';

const router = express.Router();

router.get('/transfer/storage-server', authorization, fileController.getTransferFiles);
router.get('/download/:transferId/:folderId/:fileId');
router.get('/download/folder/:transferId/:folderId', fileController.getFolder);
router.get('/download/file/:transferId/:fileId', fileController.getFile);
router.get('/download/:transferId', fileController.getTransfer);

router.post('/upload/allocate-file', fileController.getAllocateFile);
router.put('/upload', socketId, fileController.fileHandler, fileController.postSendFile);
router.put('/get-file', authorization, fileController.getFileStorage);

export default router;
