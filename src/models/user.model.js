import mongoose, {Schema} from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,    
        trim: true,    // remove white spaces
        index: true,   // for faster search
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,    
        trim: true,    // remove white spaces
    },
    fullName: {
        type: String,
        required: true, 
        trim: true,    // remove white spaces
        index: true,   // for faster search
    },
    avatar: {
        type: String,
        required: true
    },
    coverImage:{
        type: String
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type: String,
        required: [true, "Password is required"],
    },
    refreshToken:{
        type: String
    },
}, 
    {
        timestamps: true
    }
);

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        }, 
        process.env.ACCESS_TOKEN_SECRET, 
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )

}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        }, 
        process.env.REFRESH_TOKEN_SECRET, 
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )

}

userSchema.methods.generateRefreshToken = function () {}

export const User = mongoose.model("User", userSchema);