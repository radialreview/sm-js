import { EdgePermissions } from './types';

export function getEdgePermissionsString(permissions: EdgePermissions): string {
  return `
    view: ${permissions.view ? 'true' : 'false'},
    edit: ${permissions.edit ? 'true' : 'false'},
    manage: ${permissions.manage ? 'true' : 'false'},
    terminate: ${permissions.terminate ? 'true' : 'false'},
    addChild: ${permissions.addChild ? 'true' : 'false'}
  `;
}
