const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const tokenBlacklistModel = require("../models/blacklist.model");
const { Meeting } = require("../models/meeting.model");

const JWT_SECRET = process.env.JWT_SECRET;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
};

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      message: "Please provide username, email and password",
    });
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  try {
    const isUserAlreadyExists = await userModel.findOne({
      $or: [{ username: cleanUsername }, { email: cleanEmail }],
    });

    if (isUserAlreadyExists) {
      return res.status(400).json({
        message: "Account already exists with this email address or username",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hash,
    });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (e) {
    return res.status(500).json({
      message: `Something went wrong: ${e.message || e}`,
    });
  }
}

/**
 * @name loginUserController
 * @description login a user, expects email or username and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {
  const { email, username, password } = req.body;
  const identifier = (email || username || "").trim().toLowerCase();

  if (!identifier || !password) {
    return res.status(400).json({
      message: "Please provide email/username and password",
    });
  }

  try {
    const user = await userModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email/username or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid email/username or password",
      });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      message: "User loggedIn successfully.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (e) {
    return res.status(500).json({
      message: `Something went wrong: ${e.message || e}`,
    });
  }
}

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access Public
 */
async function logoutUserController(req, res) {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  try {
    if (token) {
      await tokenBlacklistModel.create({ token });
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      message: "User logged out successfully",
    });
  } catch (e) {
    return res.status(500).json({
      message: `Something went wrong: ${e.message || e}`,
    });
  }
}

/**
 * @name getMeController
 * @description get the current logged in user details
 * @access Private
 */
async function getMeController(req, res) {
  try {
    const user = await userModel.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User details fetched successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (e) {
    return res.status(500).json({
      message: `Something went wrong: ${e.message || e}`,
    });
  }
}

/**
 * @name getUserHistory
 * @description get user's past meetings
 * @access Private
 */
async function getUserHistory(req, res) {
  try {
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    const meetings = await Meeting.find({ user_id: username }).sort({ date: -1 });
    return res.status(200).json(meetings);
  } catch (e) {
    return res.status(500).json({
      message: `Something went wrong: ${e.message || e}`,
    });
  }
}

/**
 * @name addToHistory
 * @description record a meeting in user's history
 * @access Private
 */
async function addToHistory(req, res) {
  const { meeting_code } = req.body;

  if (!meeting_code || typeof meeting_code !== "string") {
    return res.status(400).json({ message: "Meeting code is required" });
  }

  const username = req.user?.username;
  if (!username) {
    return res.status(401).json({ message: "Unauthorized: User not authenticated" });
  }

  const cleanCode = meeting_code.trim().replace(/^\/+|\/+$/g, "").split("?")[0];

  try {
    const existingMeeting = await Meeting.findOne({
      user_id: username,
      meetingCode: cleanCode,
    });

    if (existingMeeting) {
      existingMeeting.date = Date.now();
      await existingMeeting.save();
    } else {
      await Meeting.create({
        user_id: username,
        meetingCode: cleanCode,
      });
    }

    return res.status(201).json({ message: "Added code to history" });
  } catch (e) {
    return res.status(500).json({
      message: `Something went wrong: ${e.message || e}`,
    });
  }
}

module.exports = {
  registerUserController,
  loginUserController,
  logoutUserController,
  getMeController,
  getUserHistory,
  addToHistory,
};
