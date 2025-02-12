import { NextFunction, Request, Response } from 'express';
import userModel, { IUser } from '../models/users_model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
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

const client = new OAuth2Client();
const googleSignin = async (req: Request, res: Response) => {
    console.log(req.body);
    try {
        const ticket = await client.verifyIdToken({
            idToken: req.body.credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload?.email;
        if (email != null) {
            let user = await userModel.findOne({ 'email': email });
            if (user == null) {
                user = await userModel.create(
                    {
                        'email': email,
                        'password': '0',
                        'imgUrl': payload?.picture
                    });
            }
            const tokens = await generateTokens(user)
            res.status(200).send(
                {
                    email: user.email,
                    _id: user._id,
                    profileImage: user.profileImage,
                    ...tokens
                })
        }
    } catch (err) {
        return res.status(400).send((err as Error).message);
    }

};

const generateTokens = async (user: Document & IUser) => {
  const secret = process.env.TOKEN_SECRET;
  if (!secret) throw new Error('Server error: missing secret.');
  const accessToken = jwt.sign({ _id: user._id }, secret, { expiresIn: process.env.TOKEN_EXPIRATION });
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  if (!refreshTokenSecret) throw new Error('Server error: missing refresh token secret.');
  const refreshToken = jwt.sign({ _id: user._id }, refreshTokenSecret);
  if (user.refreshToken == null) {
      user.refreshToken = [refreshToken];
  } else {
      user.refreshToken.push(refreshToken);
  }
  await user.save();
  return {
      'accessToken': accessToken,
      'refreshToken': refreshToken
  };
}

const register = async (req: Request, res: Response) => {
  
  const email = req.body.email;
  const password = req.body.password;
  const profileImage = req.body.profileImage;
  if (!email || !password) {
      return res.status(400).send("missing email or password");
  }
  try {
      const rs = await userModel.findOne({ 'email': email });
      if (rs != null) {
          return res.status(406).send("email already exists");
      }
      const salt = await bcrypt.genSalt(10);
      const encryptedPassword = await bcrypt.hash(password, salt);
      const rs2 = await userModel.create(
          {
              'email': email,
              'password': encryptedPassword,
              'profileImage': profileImage
          });
      const tokens = await generateTokens(rs2)
      res.status(201).send(
          {
              email: rs2.email,
              _id: rs2._id,
              profileImage: rs2.profileImage,
              ...tokens
          })
  } catch (err) {
      console.log(err);
      return res.status(400).send("error missing email or password");
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
    const tokens = generateTokens(user);
    if (!tokens) {
      return res.status(500).send({ message: 'Server error during token generation.' });
    }

    // Atomic update to add the new refresh token
    await userModel.updateOne(
      { _id: user._id },
      { $push: { refreshToken: (await tokens).refreshToken} }
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
  

export default {googleSignin, register, login, refresh, logout };