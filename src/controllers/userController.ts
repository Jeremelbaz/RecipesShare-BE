import { NextFunction, Request, Response } from 'express';
import userModel, { IUser } from '../models/users_model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { Document, Types } from 'mongoose';
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

const client = new OAuth2Client();

const googleSignin = async (req: Request, res: Response) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;
    if (!email) {
      return res.status(400).send({ message: 'Invalid credentials' });
    }
    let user = await userModel.findOne({ email });
    if (!user) {
      user = await userModel.create({
        email,
        password: '0',
        profileImage: payload?.picture,
      });
    }
    const tokens = await generateTokens(user);
    if (!tokens) {
      return res.status(500).send({ message: 'Server error' });
    }

    // Add refresh token to the array
    if (!user.refreshToken) user.refreshToken = [];
    user.refreshToken.push(tokens.refreshToken);
    await user.save();

    res.status(200).send({
      email: user.email,
      _id: user._id,
      profileImage: user.profileImage,
      ...tokens,
    });
  } catch (err: any) {
    res.status(400).send({ message: err.message });
  }
};

const generateTokens = async (user: Document & IUser) => {
  const secret = process.env.TOKEN_SECRET;
  if (!secret) {
    throw new Error('Server error: missing secret.');
  }
  const random = Math.random().toString();
  const accessToken = jwt.sign({ _id: user._id, random }, secret, {
    expiresIn: process.env.TOKEN_EXPIRES,
  });
  const refreshTokenExpires = process.env.REFRESH_TOKEN_EXPIRES;
  if (!refreshTokenExpires) {
    throw new Error('Server error: missing refresh token expires.');
  }
  const refreshToken = jwt.sign({ _id: user._id, random }, secret, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES,
  });
  return { accessToken, refreshToken };
};

const register = async (req: Request, res: Response) => {
  const { email, password, profileImage } = req.body;
  if (!email || !password) {
    return res.status(400).send({ message: 'Missing email or password' });
  }
  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(406).send({ message: 'Email already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await userModel.create({
      email,
      password: hashedPassword,
      profileImage,
    });
    const tokens = await generateTokens(newUser);
    if (!tokens) {
      return res.status(500).send({ message: 'Server error' });
    }

    // Add refresh token to the array
    if (!newUser.refreshToken) newUser.refreshToken = [];
    newUser.refreshToken.push(tokens.refreshToken);
    await newUser.save();

    res.status(201).send({
      email: newUser.email,
      _id: newUser._id,
      profileImage: newUser.profileImage,
      ...tokens,
    });
  } catch (err: any) {
    res.status(400).send({ message: err.message });
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
    const tokens = await generateTokens(user);
    if (!tokens) {
      return res.status(500).send({ message: 'Server error during token generation.' });
    }

    // Add refresh token to the array
    if (!user.refreshToken) user.refreshToken = [];
    user.refreshToken.push(tokens.refreshToken);
    await user.save();

    res.status(200).send({ ...tokens, _id: user._id });
  } catch (err: any) {
    res.status(500).send({ message: 'Internal server error.', error: err.message });
  }
};

const verifyRefreshToken = async (refreshToken: string): Promise<UserDocument> => {
  const secret = process.env.TOKEN_SECRET;
  if (!secret) {
    throw new Error('Server error: missing secret.');
  }
  const payload = jwt.verify(refreshToken, secret) as Payload;
  const user = await userModel.findById(payload._id);
  if (!user || !user.refreshToken?.includes(refreshToken)) {
    throw new Error('Invalid or expired refresh token.');
  }

    // Remove the used refresh token from the array
    user.refreshToken = user.refreshToken.filter(token => token !== refreshToken);
    await user.save();

  return user;
};

const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).send({ message: 'Refresh token is required.' });
    }
    const user = await verifyRefreshToken(refreshToken);
    const tokens = await generateTokens(user);
    if (!tokens) {
      return res.status(500).send({ message: 'Server error during token generation.' });
    }

    // Add new refresh token to the array
    user.refreshToken?.push(tokens.refreshToken);
    await user.save();
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
    await verifyRefreshToken(refreshToken);
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

const getUserById = async (req: Request, res: Response) => {
    try {
        const userId = new Types.ObjectId(req.params.id);
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send({message: "User not found"});
        }
        res.status(200).send(user);
    } catch (err: any) {
        res.status(400).send({message: err.message});
    }
};

const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await userModel.find();
        res.status(200).send(users);
    } catch (err: any) {
        res.status(400).send({message: err.message});
    }
};

const updateUser = async (req: Request, res: Response) => {
    try {
        const userId = new Types.ObjectId(req.params.id);
        const updateData = req.body;

        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        }

        const updatedUser = await userModel.findByIdAndUpdate(userId, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).send({message: "User not found"});
        }

        res.status(200).send(updatedUser);
    } catch (err: any) {
        res.status(400).send({message: err.message});
    }
};

export default { googleSignin, register, login, refresh, logout, getUserById, getAllUsers, updateUser };