import express from 'express';
import authorization from '../middlewares/authorization.js';
import appController from '../controllers/appController.js';
import socketId from '../middlewares/socketId.js';

const router = express.Router();

router.get('/redirect/storage-server', authorization, appController.getRedirectStorage);
router.get('/upload/result/:uploadId', appController.getTransferResult);
router.get('/download/:token', authorization, appController.getDownloadTransfer);

router.post('/upload/allocate-transfer', socketId, appController.getAllocateTransfer);
router.put('/redirect/main-server', authorization, appController.putRedirectMain);
router.put('/upload/:uploadId', appController.putUploadHandler);

export default router;
