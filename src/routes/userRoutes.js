import express from 'express';
import { getUsers, getUserById, uploadAvatar, updateUser, deleteUser } from '../controllers/userController.js';
import { verifyToken } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get("/", verifyToken, getUsers);
router.get('/:id', verifyToken, getUserById);
router.post("/avatar", verifyToken, upload.single("avatar"), uploadAvatar);
router.delete('/:id', verifyToken, deleteUser);
router.patch("/:id", verifyToken, upload.single("avatar"), updateUser);

export default router;

