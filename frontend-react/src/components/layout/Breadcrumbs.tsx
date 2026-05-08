import { useLocation, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function Breadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  // Filter out 'items' path segment and UUIDs (they clutter the breadcrumb)
  const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
  const filteredPathnames = pathnames.filter(
    (value) => value !== 'items' && !isUUID(value)
  )

  if (filteredPathnames.length === 0 || filteredPathnames[0] === 'auth') {
    return null
  }

  return (
    <nav className="flex items-center space-x-1.5 text-[13px] text-slate-500 font-medium mb-3">
      {filteredPathnames.map((value, index) => {
        const last = index === filteredPathnames.length - 1
        let to = `/${filteredPathnames.slice(0, index + 1).join('/')}`

        // Custom route mappings for paths that don't exist as standalone routes
        const routeMapping: Record<string, string> = {
          '/hub/bucket': '/hub?tab=buckets',
        }

        if (routeMapping[to]) {
          to = routeMapping[to]
        }

        // Format names nicely
        let name = value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        try {
          name = decodeURIComponent(name)
        } catch (e) {
          // ignore error if format is invalid
        }

        // Custom name mappings
        if (value === 'bucket') name = 'Data Buckets'

        return (
          <div key={to} className="flex items-center space-x-1.5">
            <ChevronRight className="w-4 h-4 text-slate-400" />
            {last ? (
              <span className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]" title={name}>
                {name}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-slate-900 dark:hover:text-white transition-colors truncate max-w-[150px] p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800"
                title={name}
              >
                {name}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
