import express from 'express';
import { authController } from '../controllers/authController';

const router = express.Router();

router.post('/signup', (req, res, next) => { authController.signup(req, res).catch(next) });
router.post('/login', (req, res, next) => { authController.login(req, res).catch(next) });
router.post('/google', (req, res, next) => { authController.googleLogin(req, res).catch(next) });

export default router;
