export const authConfig = {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m',
    refreshTokenExpiresIn: 24,
};
