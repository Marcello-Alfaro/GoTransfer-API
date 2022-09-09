import express from 'express';
import authController from '../controllers/auth.js';
const router = express.Router();

router.post('/signup', authController.postSignup);
router.put('/login', authController.putLogIn);
router.get('/validate-token', authController.getValidateToken);

export default router;
