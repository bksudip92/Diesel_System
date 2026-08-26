import type { Request, Response } from 'express';
import type { AuthService } from './auth.service.js';
import type { LoginInput, LogoutInput, RefreshInput } from './auth.schema.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as LoginInput;
    const result = await this.authService.login(input.email.trim().toLowerCase(), input.password);
    res.status(200).json(result);
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as RefreshInput;
    const result = await this.authService.refresh(input.refreshToken);
    res.status(200).json(result);
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as LogoutInput;
    await this.authService.logout(req.user!.sub, input.refreshToken);
    res.status(204).send();
  };
}
