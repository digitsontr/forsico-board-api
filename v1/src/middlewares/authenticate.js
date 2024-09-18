const { UNAUTHORIZED, FORBIDDEN } = require('http-status');
const jwt = require('jsonwebtoken');

const jwtSettings = {
    issuer: 'forsicoio.authApi.com',
    audience: 'forsicoio.authApi.com',
    secretKey: 'Bnxfm3x42ynnTUONOuE7gXCmb2oXYFzL'
};

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(UNAUTHORIZED).json({ message: 'Token gerekli!' });
    }

    try {
        const decoded = jwt.verify(token, jwtSettings.secretKey, {
            issuer: jwtSettings.issuer,
            audience: jwtSettings.audience,
            algorithms: ['HS256'],
        });

        req.user = decoded;
        
        next();
    } catch (err) {
        return res.status(FORBIDDEN).json({ message: 'Geçersiz token!', error: err.message });
    }
};

module.exports = verifyToken;
