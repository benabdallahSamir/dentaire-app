import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
  fr: {
    translation: {
      auth: {
        title: "Gestion de Clinique",
        subtitle: "Connectez-vous à votre compte",
        username: "Nom d'utilisateur",
        password: "Mot de passe",
        signIn: "Se connecter",
        authenticating: "Authentification...",
        errorInternal: "Une erreur s'est produite. Assurez-vous que le serveur fonctionne.",
      },
      dashboard: {
        title: "Tableau de Bord de la Clinique",
        loggedInAs: "Connecté en tant que",
        logout: "Déconnexion",
        welcomeTitle: "Bon retour !",
        welcomeSubtitle: "Votre tableau de bord professionnel est prêt.",
      },
      sidebar: {
        dashboard: "Tableau de Bord",
        patient: "Patients",
        rendezVous: "Rendez-vous",
        session: "Sessions",
        multiple_sessions: "Sessions Multiples",
        users: "Utilisateurs",
        setting: "Paramètres",
        logout: "Déconnexion",
      },
      sessions: {
        title: "Historique des sessions",
        single: {
          add: "Ajouter une session"
        },
        table: {
          id: "ID",
          patient: "PATIENT",
          date: "DATE",
          price: "Prix",
          note: "NOTE",
          actions: "ACTIONS"
        },
        multiple: {
          title: "Sessions Multiples",
          add: "Nouveau Plan de Traitement",
          table: {
            id: "ID",
            patient: "PATIENT",
            plan: "NOM DU PLAN",
            price: "PRIX TOTAL",
            paid: "PAYÉ",
            remaining: "RESTE",
            actions: "ACTIONS"
          },
          detail: {
            summary: "Résumé du Plan",
            payments: "Historique des Paiements",
            add_payment: "Ajouter un Paiement",
            total_price: "Coût Total du Plan",
            paid_amount: "Total Payé",
            balance: "Solde Restant"
          }
        }
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "fr",
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
