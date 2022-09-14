import express from 'express';
import isAuth from '../middlewares/isAuth.js';
import fileController from '../controllers/file.js';
import fileHandler from '../middlewares/fileHandler.js';

const router = express.Router();

router.post('/send-file', isAuth, fileHandler, fileController.postSendFile);
router.get('/myFiles', isAuth, fileController.getMyFiles);
router.get('/receivedFiles', isAuth, fileController.getReceivedFiles);
router.get('/download/:dirId/:fileId/', isAuth, fileController.getFile);
router.get('/download/:dirId/', isAuth, fileController.getAllFiles);

export default router;
