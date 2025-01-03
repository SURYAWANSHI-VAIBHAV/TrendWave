import { OAuth2Client } from "google-auth-library";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { options } from "../utils/constant.js";
import jwt from "jsonwebtoken";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  const { token } = req.body; // Extract token from request body

  try {
    // Verify the ID token received from Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, picture } = ticket.getPayload(); // Get user info from token

    // Check if user already exists
    let user = await User.findOne({ email });
    if (!user) {
      // Create a new user if they don't exist
      user = new User({
        username: name,
        profileName: name,
        email,
        profile_url: picture,
        password: "",
      });
      await user.save();
    }

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    // Generate JWT token
    const jwtToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Define cookie options (set secure to true in production)
    const options = {
      httpOnly: true, // Prevents JavaScript access to cookies
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    };

    // Return the response with tokens set in cookies
    const userWithoutPassword = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .cookie("token", jwtToken, options)
      .json(
        new ApiResponse(200, userWithoutPassword, "User logged in successfully")
      );
  } catch (error) {
    console.error("Google login failed:", error); // Log the error for debugging
    res.status(400).json({ error: "Google login failed. Try again later." });
  }
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    // get user details from frontend

    const { username, email, password, confirmPassword } = req.body;
    // validation - not empty

    if (
      [email, username, password].some((field) => {
        field?.trim() === "";
      })
    ) {
      throw new ApiError(400, "All fields are required");
    }

    // check if user already exists: username, email

    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      throw new ApiError(409, "User with email or username already exists");
    }

    // create user object - create entry in db

    const user = await User.create({
      username: username.toLowerCase(),
      email,
      password,
    });

    // remove password and refresh token field from response

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    // check for user creation

    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    // return res

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // Check if email and password are provided
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Find the user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // Verify the user's password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Prepare cookie options
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Set to true in production
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  // Remove password from the user object
  const userWithoutPassword = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // Send response with cookies
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, userWithoutPassword, "User logged in successfully")
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    return res
      .status(200)
      .json(new ApiResponse(200, user, "User fetched successfully"));
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getAllUser = asyncHandler(async (req, res) => {
  try {
    const users = await User.find({}).select("-password -refreshToken");

    return res
      .status(200)
      .json(new ApiResponse(200, users, "Users fetched successfully"));
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

const getUserById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select(
      "username email profilePicture profileName bio"
    );

    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "User fetched successfully"));
  } catch (error) {
    console.log(error.message); // Corrected typo 'messege' to 'message'
    res.status(500).json({ error: "Internal server error" });
  }
});

export {
  registerUser,
  loginUser,
  generateAccessAndRefreshTokens,
  logoutUser,
  getCurrentUser,
  changeCurrentPassword,
  getUserById,
  getAllUser,
  googleLogin,
};
