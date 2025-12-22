import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export const authController = {
  signup: async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          error: 'User already exists',
          code: 'USER_EXISTS'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        username,
        email,
        password: hashedPassword,
      });

      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        token,
        user: { id: user._id, username: user.username, email: user.email },
        message: 'Signup successful'
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Server error during signup' });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user and include password for comparison
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(404).json({
          error: 'User not found. Please sign up.',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.password) {
        return res.status(400).json({
          error: 'Account exists but has no password. Try signing in with Google.',
          code: 'NO_PASSWORD'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        token,
        user: { id: user._id, username: user.username, email: user.email, picture: user.picture }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error during login' });
    }
  },

  googleLogin: async (req: Request, res: Response) => {
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({ error: 'Google credential is required' });
      }

      if (!GOOGLE_CLIENT_ID) {
        console.error('GOOGLE_CLIENT_ID is not configured');
        return res.status(500).json({ error: 'Google Auth is not configured on the server' });
      }

      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        return res.status(400).json({ error: 'Invalid Google Token' });
      }

      const { email, name, sub: googleId, picture } = payload;

      let user = await User.findOne({ email });

      if (!user) {
        // Create new user if not exists
        user = await User.create({
          username: name || email.split('@')[0],
          email,
          googleId,
          picture,
        });
      } else {
        // Update Google ID if not already set (linking account)
        let updated = false;
        if (!user.googleId) {
          user.googleId = googleId;
          updated = true;
        }
        if (!user.picture && picture) {
          user.picture = picture;
          updated = true;
        }
        if (updated) {
          await user.save();
        }
      }

      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        token,
        user: { id: user._id, username: user.username, email: user.email, picture: user.picture }
      });
    } catch (error) {
      console.error('Google Login error:', error);
      res.status(500).json({ error: 'Google authentication failed' });
    }
  },
};
