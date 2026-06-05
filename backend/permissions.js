export const ROLES = ['admin', 'editor', 'viewer'];
export const PERMISSIONS = {
  admin: [
    'events:read', 'events:write', 'events:delete',
    'inventory:read', 'inventory:write', 'inventory:delete',
    'providers:read', 'providers:write', 'providers:delete',
    'purchases:read', 'purchases:write', 'purchases:delete',
    'notes:read', 'notes:write', 'notes:delete',
    'users:read', 'users:write', 'users:delete',
    'settings:write',
  ],
  editor: [
    'events:read', 'events:write',
    'inventory:read', 'inventory:write',
    'providers:read', 'providers:write',
    'purchases:read', 'purchases:write',
    'notes:read', 'notes:write',
  ],
  viewer: [
    'events:read',
    'inventory:read',
    'providers:read',
    'purchases:read',
    'notes:read',
  ],
};

export function getRolePermissions(role) {
  return PERMISSIONS[role] || PERMISSIONS.viewer;
}

export function hasPermission(role, permission) {
  return getRolePermissions(role).includes(permission);
}

export function requirePermission(role, permission) {
  if (!hasPermission(role, permission)) {
    const err = new Error(`No tenés permiso para: ${permission}`);
    err.status = 403;
    throw err;
  }
}

export function isValidRole(role) {
  return ROLES.includes(role);
}
