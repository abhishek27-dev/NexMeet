import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { Meeting } from "../models/meeting.model.js";

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Please provide username and password" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User Not Found" });
    }

    let isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (isPasswordCorrect) {
      let token = randomBytes(20).toString("hex");

      user.token = token;
      await user.save();
      return res.status(httpStatus.OK).json({ token: token });
    } else {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid Username or password" });
    }
  } catch (e) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message || e}` });
  }
};

const register = async (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Please provide name, username, and password" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name,
      username: username,
      password: hashedPassword,
    });

    await newUser.save();

    res
      .status(httpStatus.CREATED)
      .json({ message: "User Registered Successfully", newUser });
  } catch (e) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message || e}` });
  }
};

const getUserHistory = async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ message: "Unauthorized: Token required" });
  }

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Unauthorized: Invalid or expired token" });
    }
    const meetings = await Meeting.find({ user_id: user.username });
    res.json(meetings);
  } catch (e) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message || e}` });
  }
};

const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;

  if (!token || typeof token !== "string") {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ message: "Unauthorized: Token required" });
  }

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Unauthorized: Invalid or expired token" });
    }

    const existingMeeting = await Meeting.findOne({
      user_id: user.username,
      meetingCode: meeting_code,
    });

    if (!existingMeeting) {
      const newMeeting = new Meeting({
        user_id: user.username,
        meetingCode: meeting_code,
      });
      await newMeeting.save();
    }

    res.status(httpStatus.CREATED).json({ message: "Added code to history" });
  } catch (e) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: `Something went wrong: ${e.message || e}` });
  }
};

const logout = async (req, res) => {
  const { token } = req.body;

  if (!token || typeof token !== "string") {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Token is required for logout" });
  }

  try {
    const user = await User.findOne({ token: token });
    if (user) {
      user.token = "";
      await user.save();
    }
    return res.status(httpStatus.OK).json({ message: "Logged out successfully" });
  } catch (e) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: `Something went wrong: ${e.message || e}` });
  }
};

export { login, register, getUserHistory, addToHistory, logout };

