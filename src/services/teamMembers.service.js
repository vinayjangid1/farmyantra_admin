import { useQuery } from '@apollo/client'

import { ME } from '@/services/admin.api'

/** Current staff member + effective permission strings (drives PermissionsContext). */
export const useMe = () => {
  const result = useQuery(ME, { fetchPolicy: 'cache-and-network' })
  return { ...result, data: result.data ? { me: result.data.me } : undefined }
}
