import nextConfig from 'eslint-config-next'
import nextCoreWebVitalsConfig from 'eslint-config-next/core-web-vitals'

export default [
  { ignores: ['.next/**', 'node_modules/**'] },
  ...nextConfig,
  ...nextCoreWebVitalsConfig,
]
