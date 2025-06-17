const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();
const admin = require("firebase-admin");
const serviceAccount = require("../credentials.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const JWT_SECRET = process.env.JWT_SECRET;

const dummyUser = {
  username: 'admin',
  password: 'password',
};

const loginUser = (req, res) => {
  const { username, password } = req.body;
  console.log(req.body)

  if (username === dummyUser.username && password === dummyUser.password) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
};

const verifyGoogleToken = async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;
    if (!email.endsWith('@gmail.com')) {
      return res.status(403).json({ message: 'Unauthorized domain' });
    }
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '2h' });

    return res.json({ token, email });
  } catch (error) {
    console.error('Google token verification failed', error);
    return res.status(401).json({ message: 'Invalid Google token' });
  }
};

const protectedRoute = (req, res) => {
  res.json({ message: `Welcome ${req.user.username || req.user.email}! You're authorized.` });
};

module.exports = {
  loginUser,
  verifyGoogleToken,
  protectedRoute,
};
