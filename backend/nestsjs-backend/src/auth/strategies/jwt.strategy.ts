import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('jwt.secret') || 'default-secret';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const hasuraClaims = payload['https://hasura.io/jwt/claims'];
    const artisanId = hasuraClaims['x-hasura-artisan-id']
      ? parseInt(hasuraClaims['x-hasura-artisan-id'], 10)
      : undefined;
    return {
      userId: payload.userId,
      email: payload.email,
      role: hasuraClaims['x-hasura-default-role'],
      roles: hasuraClaims['x-hasura-allowed-roles'] || [hasuraClaims['x-hasura-default-role']],
      artisanId,
      hasuraClaims,
    };
  }
}
