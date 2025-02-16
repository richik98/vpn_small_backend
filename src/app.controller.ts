import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class IpFilterMiddleware implements NestMiddleware {
  private allowedIp = process.env.CENTRAL_SERVER_IP || ' ::ffff:62.4.39.15';

  use(req: Request, res: Response, next: NextFunction) {
    let clientIp: string | undefined = req.socket.remoteAddress;

    if (clientIp && clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7); // Remove the ::ffff: prefix
    }

    if (clientIp !== this.allowedIp) {
      console.log('Tried access from: ', clientIp);
      throw new ForbiddenException('Access denied');
    }

    // const requestIp = req.ip || req.socket.remoteAddress;
    // console.log(process.env.CENTRAL_SERVER_IP)
    // if (requestIp !== this.allowedIp) {
    //     console.log("Tried access from: ", requestIp)
    //   throw new ForbiddenException('Access denied');
    // }

    next();
  }
}
