import express from "express";
import { loginUser, signupUser,changePassword, getAllUsers,editUserDetails, deactivateUser, activateUser, checkTokenValidity, getUserProfile } from "../controllers/userController.js";
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

router.get('/profile/:id', getUserProfile);

router.put('/:id', editUserDetails);

// get userdata
router.post('/deactivate/:userId', deactivateUser);

router.post('/activate/:userId', activateUser);

router.get('/check-token-validity', checkTokenValidity);


export default router;

