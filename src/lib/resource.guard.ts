import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as KeycloakConnect from 'keycloak-connect';
import {
  KEYCLOAK_CONNECT_OPTIONS,
  KEYCLOAK_INSTANCE,
  KEYCLOAK_LOGGER,
  PolicyEnforcementMode,
} from 'nest-keycloak-connect';
import { META_ENFORCER_OPTIONS } from 'nest-keycloak-connect';
import { META_UNPROTECTED } from 'nest-keycloak-connect';
import { META_RESOURCE } from 'nest-keycloak-connect';
import { META_SCOPES } from 'nest-keycloak-connect';
import { KeycloakConnectConfig } from 'nest-keycloak-connect';
import { extractRequest, useKeycloak } from 'nest-keycloak-connect/util';
import { KeycloakMultiTenantService } from 'nest-keycloak-connect/services/keycloak-multitenant.service';
import { KeycloakProtectionService } from './keycloak-protection.service';

/**
 * This adds a resource guard, which is policy enforcement by default is permissive.
 * Only controllers annotated with `@Resource` and methods with `@Scopes`
 * are handled by this guard.
 */
@Injectable()
export class ResourceGuard implements CanActivate {
  constructor(
    @Inject(KEYCLOAK_INSTANCE)
    private singleTenant: KeycloakConnect.Keycloak,
    @Inject(KEYCLOAK_CONNECT_OPTIONS)
    private keycloakOpts: KeycloakConnectConfig,
    @Inject(KEYCLOAK_LOGGER)
    private logger: Logger,
    private multiTenant: KeycloakMultiTenantService,
    private readonly reflector: Reflector,

    private readonly protection: KeycloakProtectionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let resource = this.reflector.get<
      string | ((context: ExecutionContext) => string)
    >(META_RESOURCE, context.getClass());

    if (!resource) {
      resource = this.reflector.get<
        string | ((context: ExecutionContext) => string)
      >(META_RESOURCE, context.getHandler());
    }

    const scopes = this.reflector.get<string[]>(
      META_SCOPES,
      context.getHandler(),
    );
    const isUnprotected = this.reflector.getAllAndOverride<boolean>(
      META_UNPROTECTED,
      [context.getClass(), context.getHandler()],
    );
    // const enforcerOpts =
    //   this.reflector.getAllAndOverride<KeycloakConnect.EnforcerOptions>(
    //     META_ENFORCER_OPTIONS,
    //     [context.getClass(), context.getHandler()],
    //   );

    // Default to permissive
    const pem =
      this.keycloakOpts.policyEnforcement || PolicyEnforcementMode.PERMISSIVE;
    const shouldAllow = pem === PolicyEnforcementMode.PERMISSIVE;

    // Resolve resource name
    const resourceName =
      typeof resource === 'function' ? resource(context) : resource;

    // No resource given, check policy enforcement mode
    if (!resourceName) {
      if (shouldAllow) {
        this.logger.verbose(
          `Controller has no @Resource defined, request allowed due to policy enforcement`,
        );
      } else {
        this.logger.verbose(
          `Controller has no @Resource defined, request denied due to policy enforcement`,
        );
      }
      return shouldAllow;
    }

    // No scopes given, check policy enforcement mode
    if (!scopes) {
      if (shouldAllow) {
        this.logger.verbose(
          `Route has no @Scope defined, request allowed due to policy enforcement`,
        );
      } else {
        this.logger.verbose(
          `Route has no @Scope defined, request denied due to policy enforcement`,
        );
      }
      return shouldAllow;
    }

    this.logger.verbose(
      `Protecting resource [ ${resourceName} ] with scopes: [ ${scopes} ]`,
    );

    // Extract request/response
    const [request, response] = extractRequest(context);

    // if is not an HTTP request ignore this guard
    if (!request) {
      return true;
    }

    if (!request.user && isUnprotected) {
      this.logger.verbose(`Route has no user, and is public, allowed`);
      return true;
    }

    const user = request.user?.preferred_username ?? 'user';

    const isAllowed = await this.protection.hasPermission(
      {
        resource: resourceName,
        scopes,
      },
      request.headers.authorization,
    );

    // If statement for verbose logging only
    if (!isAllowed) {
      this.logger.verbose(`Resource [ ${resourceName} ] denied to [ ${user} ]`);
    } else {
      this.logger.verbose(
        `Resource [ ${resourceName} ] granted to [ ${user} ]`,
      );
    }

    return isAllowed;
  }
}
