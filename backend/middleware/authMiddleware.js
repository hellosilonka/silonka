import jwt from 'jsonwebtoken';
import User from '../models/User.js';
export const protect = async (req, res, next) => {
    try {
        if (!req.cookies?.jwt) return res.status(401).json({ message: 'Please sign in to continue.' });
        const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        if (typeof decoded.userId !== 'string' || !/^[a-f\d]{24}$/i.test(decoded.userId)) return res.status(401).json({ message: 'Session expired. Please sign in.' });
        req.user = await User.findById(decoded.userId).select('-password');
        if (!req.user) return res.status(401).json({ message: 'Session expired. Please sign in.' });
        next();
    } catch (err) {
        if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(err.name)) return res.status(401).json({ message: 'Session expired. Please sign in.' });
        next(err);
    }
};
export const admin = (req, res, next) => req.user?.isAdmin ? next() : res.status(403).json({ message: 'Administrator access required.' });
