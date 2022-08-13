import { SetMetadata, ContextType, ExecutionContext } from '@nestjs/common';

export interface ResourceDecoratorOptions {
  key: string;
  source?: 'params' | 'body' | 'headers';
}

export const META_RESOURCE = 'resource';
type GqlContextType = 'graphql' | ContextType;

/**
 * Keycloak Resource.
 * @param resource - name of resource
 */
export const Resource = (resource: string | ResourceDecoratorOptions) =>
  SetMetadata(
    META_RESOURCE,
    typeof resource === 'string' ? resource : extractResourceName(resource),
  );

const extractResourceName =
  (options: ResourceDecoratorOptions) =>
  (context: ExecutionContext): string => {
    const { key, source = 'params' } = options;

    let resource: string;

    if (!key) {
      throw new Error('Resource key is required');
    }

    // Check if request is coming from graphql or http
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      resource = request?.[source]?.[key];
    } else if (context.getType<GqlContextType>() === 'graphql') {
      const args = context.getArgs()[1] as any;
      resource = args?.[key];
    }

    return resource;
  };
