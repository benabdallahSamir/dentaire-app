import DashboardLayout from '../layouts/DashboardLayout';
import { useTranslation } from 'react-i18next';

function Patients() {
  const { t } = useTranslation();
  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-neutral-900 mb-8 border-b border-neutral-200 pb-4">
        {t('sidebar.patients')}
      </h1>
      <p className="text-neutral-500">Patients page content will go here.</p>
    </DashboardLayout>
  );
}

export default Patients;
