import { NextFunction, Request, Response } from 'express';
import userModel, { IUser } from '../models/users_model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Document } from 'mongoose';
import ExtendedRequest from '../interface';

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

type Payload = {
  _id: string;
};

type UserDocument = Document & IUser & {
  _id: string;
};

const generateTokens = (userId: string): Tokens | null => {
  const secret = process.env.TOKEN_SECRET;
  if (!secret) return null;
  const random = Math.random().toString();
  const accessToken = jwt.sign({ _id: userId, random }, secret, { expiresIn: process.env.TOKEN_EXPIRES });
  const refreshToken = jwt.sign({ _id: userId, random }, secret, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES });

  return { accessToken, refreshToken };
};

const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({ message: 'Email and password are required.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({ email, password: hashedPassword });
    res.status(201).send({ message: 'User registered successfully!', user });
  } catch (err: any) {
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).send({ message: 'Email already exists.' });
    }
    res.status(500).send({ message: 'Internal server error.', error: (err as Error).message });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({ message: 'Email and password are required.' });
    }

    const user = await userModel.findOne({ email });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).send({ message: 'Invalid email or password.' });
    }

    const tokens = generateTokens(user._id);
    if (!tokens) {
      return res.status(500).send({ message: 'Server error during token generation.' });
    }

    // Atomic update of refresh tokens
    await userModel.updateOne(
      { _id: user._id },
      { $push: { refreshToken: tokens.refreshToken } }
    );

    res.status(200).send({ ...tokens, _id: user._id });
  } catch (err) {
    res.status(500).send({ message: 'Internal server error.', error: (err as Error).message });
  }
};

const verifyRefreshToken = async (refreshToken: string): Promise<UserDocument> => {
  const secret = process.env.TOKEN_SECRET;
  if (!secret) throw new Error('Server error: missing secret.');

  const payload = jwt.verify(refreshToken, secret) as Payload;
  const user = await userModel.findById(payload._id);
  if (!user || !user.refreshToken?.includes(refreshToken)) {
    throw new Error('Invalid or expired refresh token.');
  }

  // Atomic update to remove the used refresh token
  await userModel.updateOne(
    { _id: user._id },
    { $pull: { refreshToken } }
  );
  return user;
};

const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).send({ message: 'Refresh token is required.' });
    }

    const user = await verifyRefreshToken(refreshToken);
    const tokens = generateTokens(user._id);
    if (!tokens) {
      return res.status(500).send({ message: 'Server error during token generation.' });
    }

    // Atomic update to add the new refresh token
    await userModel.updateOne(
      { _id: user._id },
      { $push: { refreshToken: tokens.refreshToken } }
    );

    res.status(200).send({ ...tokens, _id: user._id });
  } catch (err: any) {
    res.status(400).send({ message: err.message });
  }
};

const logout = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
  
      if (!refreshToken) {
        return res.status(400).send({ message: 'Refresh token is required.' });
      }
  
      const user = await verifyRefreshToken(refreshToken); 
      await user.save(); // This line is crucial to persist the updated refreshTokens array
  
      res.status(200).send({ message: 'Logged out successfully.' });
    } catch (err: any) {
      res.status(400).send({ message: err.message });
    }
};
  
export const authMiddleware = (req: ExtendedRequest, res: Response, next: NextFunction) => {
    const authorization = req.header('Authorization');
    const token = authorization?.split(' ')[1];
  
    if (!token) {
      return res.status(401).send({ message: 'Access denied. No token provided.' });
    }
  
    const secret = process.env.TOKEN_SECRET;
    if (!secret) {
      return res.status(500).send({ message: 'Server error: missing secret.' });
    }
  
    try {
      const payload = jwt.verify(token, secret) as { _id: string };
      req.user = { _id: payload._id }; 
      next();
    } catch (err) {
      res.status(401).send({ message: 'Access denied. Invalid token.' });
    }
  };
  

export default { register, login, refresh, logout };