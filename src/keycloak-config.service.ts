import { Injectable } from '@nestjs/common';
import { KeycloakConnectOptionsFactory } from 'nest-keycloak-connect';
import { KeycloakConnectOptions } from 'nest-keycloak-connect/interface/keycloak-connect-options.interface';

@Injectable()
export class KeyCloakConfigService implements KeycloakConnectOptionsFactory {
  constructor() {
    //
  }

  createKeycloakConnectOptions():
    | KeycloakConnectOptions
    | Promise<KeycloakConnectOptions> {
    //

    return {
      realm: 'photoz',
      'auth-server-url': 'http://localhost:28080/auth',
      clientId: 'rest-api',
      secret: 'gMq8WGuMhpEKaFMaeCyLwh6og6BKBrKx',

      // clientId: 'web-app',
      // secret: 'mY6T60hxgCWotNC9iI8fJ78F1wm2UYBT',
    };
  }
}
