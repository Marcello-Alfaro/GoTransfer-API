import express from 'express';
import authorization from '../middlewares/authorization.js';
import appController from '../controllers/appController.js';

const router = express.Router();

router.get('/redirect/storage-server', authorization, appController.getRedirectStorage);
router.get('/upload/result/:transferId', appController.getTransferResult);
router.get('/download/:token', authorization, appController.getDownloadTransfer);

router.post('/upload/allocate-transfer', appController.getAllocateTransfer);
router.put('/redirect/main-server', authorization, appController.putRedirectMain);
router.put('/upload/:transferId', appController.putUploadHandler);

export default router;
