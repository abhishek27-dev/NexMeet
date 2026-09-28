const { Router } = require("express");
const {
  registerUserController,
  loginUserController,
  logoutUserController,
  getMeController,
  getUserHistory,
  addToHistory,
} = require("../controllers/user.controller");
const { authUser } = require("../middlewares/auth.middleware");

const router = Router();

/**
 * @route POST /api/v1/users/register
 * @description Register a new user
 * @access Public
 */
router.post("/register", registerUserController);

/**
 * @route POST /api/v1/users/login
 * @description Login user with username and password
 * @access Public
 */
router.post("/login", loginUserController);

/**
 * @route GET & POST /api/v1/users/logout
 * @description Clear token from cookie and add to blacklist
 * @access Public
 */
router.get("/logout", logoutUserController);
router.post("/logout", logoutUserController);

/**
 * @route GET /api/v1/users/get-me
 * @description Get current logged in user details
 * @access Private
 */
router.get("/get-me", authUser, getMeController);

/**
 * @route POST /api/v1/users/add_to_activity
 * @description Add meeting to user history
 * @access Private
 */
router.post("/add_to_activity", authUser, addToHistory);

/**
 * @route GET /api/v1/users/get_all_activity
 * @description Get user's meeting history
 * @access Private
 */
router.get("/get_all_activity", authUser, getUserHistory);

module.exports = router;
