import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  Roles,
  Unprotected,
  AuthenticatedUser,
  Scopes,
} from 'nest-keycloak-connect';
import { AppService } from './app.service';
import { KeycloakProtectionService } from './lib/keycloak-protection.service';
import { Resource } from './lib/resource.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly protection: KeycloakProtectionService,
  ) {}

  @Get()
  @Unprotected()
  getpublic(): string {
    return `${this.appService.getHello()} from public`;
  }

  @Get('/user')
  @Roles({ roles: ['user'] })
  getUser(): string {
    return `${this.appService.getHello()} from user`;
  }

  @Get('/admin')
  @Roles({ roles: ['admin'] })
  getAdmin(): string {
    return `${this.appService.getHello()} from admin`;
  }

  @Get('/all')
  @Roles({ roles: ['user', 'admin'] })
  getAll(): string {
    return `${this.appService.getHello()} from all`;
  }

  @Get('/album/:id')
  @Resource({ key: 'id' })
  @Scopes('album:view')
  viewAlbum(@Body() body: any, @AuthenticatedUser() user: any): string {
    return `${this.appService.getHello()} from album ${body.id}`;
  }

  @Post('/album')
  @Roles({ roles: ['user'] })
  async createAlbum(
    @Body() body: any,
    @AuthenticatedUser() user: any,
  ): Promise<any> {
    const resource = {
      name: body.id,
      displayName: body.name,
      owner: user.preferred_username,
      type: 'http://photoz.com/album',
      resource_scopes: ['album:view', 'album:delete'],
      uris: [`/album/${body.id}`],
      ownerManagedAccess: true,
    };

    console.log('resource', resource);
    await this.protection.createResource(resource);
    return `${this.appService.getHello()} from user`;
  }
}
