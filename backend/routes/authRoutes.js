import { asyncHandler } from '../utils/http.js';
import express from 'express';
import {
    authUser,
    registerUser,
    logoutUser,
    getUserProfile,
    getUsers,
    deleteUser,
    updateUser,
    googleAuth
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', asyncHandler(registerUser));
router.post('/login', asyncHandler(authUser));
router.post('/logout', asyncHandler(logoutUser));
router.post('/google', asyncHandler(googleAuth));
router.get('/profile', protect, asyncHandler(getUserProfile));
router.get('/users', protect, admin, asyncHandler(getUsers));
router.route('/users/:id')
    .delete(protect, admin, asyncHandler(deleteUser))
    .put(protect, admin, asyncHandler(updateUser));

export default router;
