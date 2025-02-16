import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class IpFilterMiddleware implements NestMiddleware {
  private allowedIp = process.env.CENTRAL_SERVER_IP || ' ::ffff:62.4.39.15';

  use(req: Request, res: Response, next: NextFunction) {
    const requestIp = req.ip || req.connection.remoteAddress;

    if (requestIp !== this.allowedIp) {
      console.log('Tried access from: ', requestIp);
      throw new ForbiddenException('Access denied');
    }

    next();
  }
}
