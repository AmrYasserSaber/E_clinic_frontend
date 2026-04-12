import { AuthUser, UserRole } from '../../models/domain.models';
import { UserMeApi } from '../../models/auth-api.models';

const GROUP_PRIORITY: readonly string[] = ['Admin', 'Doctor', 'Receptionist', 'Patient'];

export function groupsToUserRole(groups: string[]): UserRole | null {
  for (const name of GROUP_PRIORITY) {
    if (groups.includes(name)) {
      return name.toLowerCase() as UserRole;
    }
  }
  return null;
}

export function mapUserMeToAuthUser(api: UserMeApi): AuthUser | null {
  const role = groupsToUserRole(api.groups);
  if (!role) return null;
  const fullName = [api.first_name, api.last_name].filter(Boolean).join(' ').trim() || api.email;
  return {
    id: api.id,
    fullName,
    email: api.email,
    role,
  };
}
