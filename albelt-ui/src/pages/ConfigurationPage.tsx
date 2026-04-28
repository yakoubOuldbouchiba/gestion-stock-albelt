import { Suspense, lazy, useState } from 'react';
import { useI18n } from '@hooks/useI18n';
import { PageHeader, Tabs, LazyLoadingFallback } from '@components/index';

const SuppliersPage = lazy(() => import('./SuppliersPage'));
const ClientsPage = lazy(() => import('./ClientsPage'));
const AltierPage = lazy(() => import('./AltierPage'));
const UsersPage = lazy(() => import('./UsersPage'));
const MaterialChuteThresholdsPage = lazy(() => import('./MaterialChuteThresholdsPage'));
const ColorsPage = lazy(() => import('./ColorsPage'));

export function ConfigurationPage() {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);

  const tabs = [
    {
      label: t('navigation.suppliers'),
      icon: 'pi-briefcase',
      content: (
        <Suspense fallback={<LazyLoadingFallback />}>
          <SuppliersPage hideHeader />
        </Suspense>
      ),
    },
    {
      label: t('navigation.clients'),
      icon: 'pi-users',
      content: (
        <Suspense fallback={<LazyLoadingFallback />}>
          <ClientsPage hideHeader />
        </Suspense>
      ),
    },
    {
      label: t('sidebar.workshops'),
      icon: 'pi-building',
      content: (
        <Suspense fallback={<LazyLoadingFallback />}>
          <AltierPage hideHeader />
        </Suspense>
      ),
    },
    {
      label: t('navigation.users'),
      icon: 'pi-user',
      content: (
        <Suspense fallback={<LazyLoadingFallback />}>
          <UsersPage hideHeader />
        </Suspense>
      ),
    },
    {
      label: t('navigation.materialChute'),
      icon: 'pi-sliders-h',
      content: (
        <Suspense fallback={<LazyLoadingFallback />}>
          <MaterialChuteThresholdsPage hideHeader />
        </Suspense>
      ),
    },
    {
      label: t('navigation.colors') || 'Colors',
      icon: 'pi-palette',
      content: (
        <Suspense fallback={<LazyLoadingFallback />}>
          <ColorsPage hideHeader />
        </Suspense>
      ),
    },
  ];

  return (
    <div className="configuration-page">
      <PageHeader 
        title={t('sidebar.configuration')} 
        subtitle={t('common.settings') || 'System settings'}
      />
      
      <Tabs 
        tabs={tabs} 
        activeIndex={activeIndex} 
        onTabChange={(index) => setActiveIndex(index)} 
      />
    </div>
  );
}


export default ConfigurationPage;
