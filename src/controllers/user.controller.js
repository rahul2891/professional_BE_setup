import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const generateAccessAndRefreshToken = async (userId) => {
   try {
       const user = await User.findById(userId)
       const accessToken = user.generateAccessToken();
       const refreshToken = user.generateRefreshToken();

       user.refreshToken = refreshToken;
         await user.save({validateBeforeSave: false});

         return { accessToken, refreshToken }
   } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    
   }

}

const registerUser = asyncHandler(async (req, res) => {

    // register user steps
    // get user details from frontend
    // 1. validate the user data
    // check if the user already exists - username and email
    // check for avatar
    // upload it on cloudinary
   // create user object - create entry in database
    // 2. hash the password
    // 3. save the user to the database
    // 4. generate the jwt token
    // 5. send the response
    // 7. generate the refresh token


    const {fullName, email, username, password, } = req.body
    console.log("email", email)

    if([fullName, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{email}, {username}]
    })

    if(existedUser){
        throw new ApiError(400, "User already exists")
    }

   // console.log(req.files)

    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }
    
    // upload avatar on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) {
        throw new ApiError(500, "Something went wrong while uploading avatar")
    }

   const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        username: username.toLowerCase(),
        password,
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while creating user")
    }

    return res.status(201).json(new ApiResponse(200, createdUser, "User created successfully"))
});


const loginUser = asyncHandler(async (req, res) => {
    // login user steps
    // 1. validate the user data [ req.body = data from frontend]
    // 2. check if the user exists [ username or email]
    // 3. compare the password
    // 4. generate the jwt token
    // 5. send the response
    // 6. generate the refresh token
    // send cookies to the client

    const {email, username, password} = req.body;

    if(!email && !username) {
        throw new ApiError(400, "Email or username is required")
    }

   const user = await User.findOne({
        $or: [{email}, {username}]
    })

    if(!user) {
        throw new ApiError(400, "User does not exits")
    }

   const isPasswordCorrect = await user.matchPassword(password);
   
   if(!isPasswordCorrect) {
         throw new ApiError(400, "Password is incorrect")
   }

   const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   const options = {
        httpOnly: true,
        secure: true
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(new ApiResponse(200, {
        user: loggedInUser, accessToken, refreshToken
   }, "User logged in successfully"))

});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
    
})

export { registerUser, loginUser }