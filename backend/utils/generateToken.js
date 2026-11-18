import jwt from 'jsonwebtoken';
export const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
export default function generateToken(res, userId) {
    const token = jwt.sign({ userId: String(userId) }, process.env.JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
    res.cookie('jwt', token, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
}
