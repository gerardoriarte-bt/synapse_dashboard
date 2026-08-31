import { MainLayout } from '@/components/layout'
import { AppProviders } from './providers/AppProviders'
import { AppRouter } from './router/AppRouter'

export function App() {
  return (
    <AppProviders>
      <MainLayout>
        <AppRouter />
      </MainLayout>
    </AppProviders>
  )
}
