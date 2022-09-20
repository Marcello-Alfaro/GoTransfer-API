import express from 'express';
import isAuth from '../middlewares/isAuth.js';
import fileController from '../controllers/file.js';
import fileHandler from '../middlewares/fileHandler.js';
import pump from 'pump';
import File from '../models/file.js';
import socket from '../socket.js';
let response;

const router = express.Router();

router.get('/myFiles', isAuth, fileController.getMyFiles);
router.get('/receivedFiles', isAuth, fileController.getReceivedFiles);
router.get('/download/:dirId/:fileId', isAuth, fileController.getFile);
// router.get('/download/:dirId/', isAuth, fileController.getAllFiles);
router.get('/transfer/:dirId/:fileId', isAuth, fileController.getTransferFiles);
router.get('/download/:dirId', isAuth, fileController.getAllFiles);
/* router.get('/download/:dirId/:fileId/', isAuth, fileController.getFile);
router.get('/download/:dirId/', isAuth, fileController.getAllFiles); */

router.post('/send-file', isAuth, fileHandler, fileController.postSendFile);
router.post('/get-file', isAuth, fileController.getFileStorage);
router.post('/get-all-files', isAuth, fileController.getAllFilesStorage);

export default router;
