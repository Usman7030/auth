const AuthenticatedUser = {
  exp: 1659666131,
  iat: 1659630131,
  jti: '24875175-4cab-4ca6-8d41-b708b4bb4dec',
  iss: 'http://localhost:28080/auth/realms/photoz',
  aud: ['rest-api', 'account'],
  sub: '96e8239c-aa8b-48ee-82d8-87223c9a7f21',
  typ: 'Bearer',
  azp: 'web-app',
  session_state: 'f36e7b6d-b069-4fa6-abd6-52025c9d03c6',
  acr: '1',
  'allowed-origins': ['http://localhost:28080'],
  realm_access: {
    roles: [
      'offline_access',
      'default-roles-photoz',
      'uma_authorization',
      'user',
    ],
  },
  resource_access: {
    'rest-api': {
      roles: ['user'],
    },
    account: {
      roles: ['manage-account', 'manage-account-links', 'view-profile'],
    },
  },
  scope: 'email profile',
  sid: 'f36e7b6d-b069-4fa6-abd6-52025c9d03c6',
  email_verified: true,
  preferred_username: 'user1',
  email: 'user1@mevris.app',
  client_id: 'bf954cec-bb20-4a43-93aa-e076af575e2b',
};

const MevrisContext = {
  user: {
    username: 'user1',
    email: 'user1@mevris.app',
    email_verified: true,
  },
  client: {
    id: 'bf954cec-bb20-4a43-93aa-e076af575e2b',
    key: 'web-app',
  },
};

function convertAuthenticatedUserToMevrisContext(
  authenticatedUser: any,
): typeof MevrisContext {
  return {
    user: {
      username: authenticatedUser.preferred_username,
      email: authenticatedUser.email,
      email_verified: authenticatedUser.email_verified,
    },
    client: {
      id: authenticatedUser.client_id,
      key: authenticatedUser.azp,
    },
  };
}
