import { Request } from 'express';

interface ExtendedRequest extends Request {
  user?: { _id: string }; 
}

export default ExtendedRequest;