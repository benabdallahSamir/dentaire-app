import DashboardLayout from '../layouts/DashboardLayout';
import { useTranslation } from 'react-i18next';

function Sessions() {
  const { t } = useTranslation();
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        {t('sidebar.session')}
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400">Session management page content will go here.</p>
    </DashboardLayout>
  );
}

export default Sessions;
