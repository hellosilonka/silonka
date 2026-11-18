import crypto from 'node:crypto';
import User from '../models/User.js';
import generateToken, { cookieOptions } from '../utils/generateToken.js';
import { OAuth2Client } from 'google-auth-library';
import { emailField, textField, pagination, httpError } from '../utils/http.js';

const publicUser = user => ({ _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, createdAt: user.createdAt });
function passwordField(value, registering = false) {
    if (typeof value !== 'string' || !value || Buffer.byteLength(value) > 72 || (registering && value.length < 8)) throw httpError(400, 'Use a password of at least 8 characters and no more than 72 bytes.');
    return value;
}
export const authUser = async (req, res) => {
    const email = emailField(req.body.email), password = passwordField(req.body.password);
    const user = await User.findOne({ email }).select('+password');
    if (!user || !await user.matchPassword(password)) throw httpError(401, 'Invalid email or password.');
    generateToken(res, user._id);
    res.json(publicUser(user));
};
export const registerUser = async (req, res) => {
    const name = textField(req.body.name, 'name', 100), email = emailField(req.body.email), password = passwordField(req.body.password, true);
    if (await User.exists({ email })) throw httpError(409, 'An account with this email already exists. Please sign in.');
    const user = await User.create({ name, email, password });
    generateToken(res, user._id);
    res.status(201).json(publicUser(user));
};
export const logoutUser = (req, res) => {
    res.clearCookie('jwt', cookieOptions());
    res.json({ message: 'Logged out successfully' });
};
export const getUserProfile = (req, res) => res.json(publicUser(req.user));
export const getUsers = async (req, res) => {
    const { page, limit, skip } = pagination(req.query);
    const [count, users] = await Promise.all([User.countDocuments(), User.find({}).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }).lean()]);
    res.json({ users, page, pages: Math.ceil(count / limit), total: count });
};
export const deleteUser = async (req, res) => {
    if (String(req.user._id) === req.params.id) throw httpError(400, 'Cannot delete yourself.');
    const user = await User.findById(req.params.id);
    if (!user) throw httpError(404, 'User not found.');
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User removed' });
};
export const updateUser = async (req, res) => {
    if (String(req.user._id) === req.params.id) throw httpError(400, 'Cannot change your own administrator access.');
    if (typeof req.body.isAdmin !== 'boolean') throw httpError(400, 'Invalid administrator setting.');
    const user = await User.findById(req.params.id);
    if (!user) throw httpError(404, 'User not found.');
    user.isAdmin = req.body.isAdmin;
    await user.save();
    res.json(publicUser(user));
};
export const googleAuth = async (req, res) => {
    if (typeof req.body.token !== 'string' || req.body.token.length > 10000) throw httpError(400, 'Google token is required.');
    if (!process.env.GOOGLE_CLIENT_ID) throw httpError(503, 'Google sign-in is not configured.');
    let payload;
    try {
        const ticket = await new OAuth2Client(process.env.GOOGLE_CLIENT_ID).verifyIdToken({ idToken: req.body.token, audience: process.env.GOOGLE_CLIENT_ID });
        payload = ticket.getPayload();
    } catch { throw httpError(401, 'Google sign-in could not be verified. Please try again.'); }
    if (!payload?.email_verified || !payload.email || !payload.sub) throw httpError(401, 'A verified Google email is required.');
    const email = emailField(payload.email);
    let user = await User.findOne({ email });
    if (!user) {
        try { user = await User.create({ name: payload.name || email.split('@')[0], email, password: crypto.randomBytes(32).toString('hex') }); }
        catch (err) { if (err.code !== 11000) throw err; user = await User.findOne({ email }); }
    }
    generateToken(res, user._id);
    res.json({ ...publicUser(user), picture: payload.picture });
};
