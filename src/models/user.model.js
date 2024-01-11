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
    fullname: {
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

export const User = mongoose.model("User", userSchema);