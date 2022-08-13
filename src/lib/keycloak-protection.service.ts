/* eslint-disable camelcase */
import { HttpService, Injectable, Logger } from '@nestjs/common';
import { Dictionary } from 'lodash';
import * as qs from 'qs';
import { KeycloakConnectConfig } from 'nest-keycloak-connect/interface/keycloak-connect-options.interface';
import { KeyCloakConfigService } from '../keycloak-config.service';

import {
  ClientCredentials,
  ResourceOwnerPassword,
  AuthorizationCode,
} from 'simple-oauth2';

export interface KeycloakProtectionQueryParams extends Dictionary<any> {
  name?: string;
  uri?: string;
  owner?: any;
  type?: string;
  scope?: string;
}

@Injectable()
export class KeycloakProtectionService {
  private logger: Logger = new Logger(this.constructor.name);
  private configs: KeycloakConnectConfig;
  private token;

  constructor(
    private readonly configService: KeyCloakConfigService,
    private readonly httpService: HttpService,
  ) {
    this.loadConfigs();
  }

  private async loadConfigs() {
    if (this.configs) {
      return this.configs;
    }

    this.configs =
      (await this.configService.createKeycloakConnectOptions()) as KeycloakConnectConfig;
  }

  public async createResource(data: any): Promise<any> {
    const pat = await this.getProtectionApiToken();

    // await this.saveToken()

    await this.httpService
      .post(this.getBaseUrl(), data, {
        headers: {
          Authorization: `Bearer ${pat}`,
          'Content-Type': 'application/json',
        },
      })
      .toPromise();
  }

  public async updateResource(resourceId: string, data: any): Promise<any> {
    const pat = await this.getProtectionApiToken();

    await this.httpService
      .put(`${this.getBaseUrl()}/${resourceId}`, data, {
        headers: {
          Authorization: `Bearer ${pat}`,
          'Content-Type': 'application/json',
        },
      })
      .toPromise();
  }

  public async deleteResource(resourceId: string): Promise<any> {
    const pat = await this.getProtectionApiToken();

    await this.httpService
      .delete(`${this.getBaseUrl()}/${resourceId}`, {
        headers: {
          Authorization: `Bearer ${pat}`,
        },
      })
      .toPromise();
  }

  public async getOne(resourceId: string): Promise<any> {
    const pat = await this.getProtectionApiToken();

    const result = await this.httpService
      .get(`${this.getBaseUrl()}/${resourceId}`, {
        headers: {
          Authorization: `Bearer ${pat}`,
          'Content-Type': 'application/json',
        },
      })
      .toPromise();

    return result.data;
  }

  public async query(params: KeycloakProtectionQueryParams): Promise<any> {
    const pat = await this.getProtectionApiToken();

    const result = await this.httpService
      .get(this.getBaseUrl(), {
        headers: {
          Authorization: `Bearer ${pat}`,
          'Content-Type': 'application/json',
        },
        params,
      })
      .toPromise();

    return result.data;
  }

  public async hasPermission(
    options: { resource?: string; scopes?: string[] | string },
    Authorization: string,
  ): Promise<boolean> {
    const configs: any =
      await this.configService.createKeycloakConnectOptions();

    // Resolve scopes
    const scopes =
      typeof options.scopes === 'string' ? [options.scopes] : options.scopes;

    // ['123#album:view']
    const permission = [
      scopes.length > 0
        ? `${options.resource}#${scopes.join(', ')}`
        : options.resource,
    ];

    this.logger.verbose(`Checking permissions: ${JSON.stringify(permission)}`);

    try {
      const json = await this.httpService
        .request<{ result: boolean }>({
          method: 'POST',
          url: this.getTokenUrl(),

          headers: {
            Authorization,
            'Content-Type': 'application/x-www-form-urlencoded',
          },

          data: qs.stringify(
            {
              grant_type: 'urn:ietf:params:oauth:grant-type:uma-ticket',
              audience: configs.resource_server_id ?? configs.clientId,
              response_mode: 'decision',
              permission,
            },
            { arrayFormat: 'comma', encode: false },
          ),
        })
        .toPromise();

      return json.data.result;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  private async getProtectionApiToken() {
    // console.log('first line');

    const configs: any =
      await this.configService.createKeycloakConnectOptions();

    const config = {
      client: {
        id: 'rest-api',
        secret: configs.secret,
        // grant_type:''
      },

      auth: {
        tokenHost: 'http://localhost:28080',
        tokenPath: '/auth/realms/photoz/protocol/openid-connect/token',
      },
    };

    const client = new ClientCredentials(config);
    const tokenParams = {
      scope: 'email profile',
    };

    if (!this.token) {
      // console.log('first time');

      const accessToken = await client.getToken(tokenParams, { json: true });

      this.token = accessToken;

      let pat = accessToken.token.access_token;

      return pat;
    } else if (this.token) {
      if (this.token.expired()) {
        // console.log('after exp.');
        let accessToken = await this.token.refresh(tokenParams);

        this.token = accessToken;

        let pat = accessToken.token.access_token;

        return pat;
      } else {
        // console.log('else case ');

        let pat = this.token.token.access_token;
        return pat;
      }
    }
  }

  private getBaseUrl(): string {
    const authServerUrl = this.configs['auth-server-url'];
    const host = authServerUrl.endsWith('/')
      ? authServerUrl.slice(0, -1)
      : authServerUrl;

    return `${host}/realms/${this.configs.realm}/authz/protection/resource_set`;
  }

  public getTokenUrl(): string {
    const authServerUrl = this.configs['auth-server-url'];
    const host = authServerUrl.endsWith('/')
      ? authServerUrl.slice(0, -1)
      : authServerUrl;

    return `${host}/realms/${this.configs.realm}/protocol/openid-connect/token`;
  }
}
