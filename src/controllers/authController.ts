import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';
import { HTTP_STATUS } from '../constants/http.js';
import { RegisterDTO, LoginDTO } from '../schemas/authSchema.js';

export const register = async (
  req: Request<{}, {}, RegisterDTO>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await AuthService.registerUser(req.body);
    sendSuccess(
      res,
      'Registrasi akun MutaCare berhasil',
      result,
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request<{}, {}, LoginDTO>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await AuthService.loginUser(req.body);
    sendSuccess(
      res,
      'Login berhasil',
      result,
      HTTP_STATUS.OK
    );
  } catch (error) {
    next(error);
  }
};
