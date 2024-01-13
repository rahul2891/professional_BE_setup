import { asyncHandler } from "../utils/asyncHandler";


const verifyJWT = asyncHandler(async (req, res, next) => {
    req.cookie?.accessToken
});