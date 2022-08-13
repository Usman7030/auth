import { HttpModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  AuthGuard,
  KeycloakConnectModule,
  RoleGuard,
} from 'nest-keycloak-connect';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KeyCloakConfigService } from './keycloak-config.service';
import { KeycloakProtectionService } from './lib/keycloak-protection.service';
import { ResourceGuard } from './lib/resource.guard';

import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AlbumsModule } from './graphql/album.module';

@Module({
  imports: [
    AlbumsModule,

    KeycloakConnectModule.registerAsync({
      useClass: KeyCloakConfigService,
    }),
    // KeycloakConnectModule.register('./keycloak.json'),
    // {
    //   authServerUrl: 'http://localhost:8080/auth',
    //   realm: 'Demo-Realm',
    //   clientId: 'nest-app',
    //   secret: '83790b4f-48cd-4b6c-ac60-451a918be4b9',
    //   // Secret key of the client taken from keycloak server
    // }
    HttpModule,

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      installSubscriptionHandlers: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    KeyCloakConfigService,
    KeycloakProtectionService,

    // This adds a global level authentication guard,
    // you can also have it scoped
    // if you like.
    //
    // Will return a 401 unauthorized when it is unable to
    // verify the JWT token or Bearer header is missing.
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    // This adds a global level resource guard, which is permissive.
    // Only controllers annotated with @Resource and
    // methods with @Scopes
    // are handled by this guard.
    {
      provide: APP_GUARD,
      useClass: ResourceGuard,
    },
    // New in 1.1.0
    // This adds a global level role guard, which is permissive.
    // Used by `@Roles` decorator with the
    // optional `@AllowAnyRole` decorator for allowing any
    // specified role passed.
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule {}
