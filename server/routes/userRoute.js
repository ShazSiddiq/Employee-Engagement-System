import express from "express";
import { loginUser, signupUser,changePassword, getAllUsers, deactivateUser, activateUser } from "../controllers/userController.js";
import requireAuth from "../middlewares/requireAuth.js";

const router = express.Router();

// Login route
router.post("/login", loginUser);

// Signup route
router.post("/signup", signupUser);

// Change password
router.post('/change-password', changePassword);

// get userdata
router.get('/userlist', getAllUsers);

// get userdata
router.post('/deactivate/:userId', deactivateUser);

router.post('/activate/:userId', activateUser);

export default router;

