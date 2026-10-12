import { useLocation } from 'react-router-dom'
import { navigationConfig } from '@/app/routes.config'

const flatten = (items) => items.flatMap((item) => [item, ...(item.children ? flatten(item.children) : [])])

/** Title of the nav entry matching the current path (detail pages inherit their list's title). */
export const usePageTitle = () => {
  const { pathname } = useLocation()
  const match = flatten(navigationConfig)
    .filter((item) => item.path && (pathname === item.path || pathname.startsWith(`${item.path}/`)))
    .sort((a, b) => b.path.length - a.path.length)[0]
  return match?.title || 'Dashboard'
}

export default usePageTitle
