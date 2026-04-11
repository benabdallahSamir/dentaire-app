import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translations
const resources = {
  en: {
    translation: {
      auth: {
        title: "Clinic Management",
        subtitle: "Sign in to your account",
        username: "Username",
        password: "Password",
        signIn: "Sign In",
        authenticating: "Authenticating...",
        errorInternal: "An error occurred during login. Ensure the backend is running.",
      },
      dashboard: {
        title: "Clinic Dashboard",
        loggedInAs: "Logged in as",
        logout: "Logout",
        welcomeTitle: "Welcome back!",
        welcomeSubtitle: "Your professional clinic management dashboard is ready.",
      },
      sidebar: {
        dashboard: "Dashboard",
        patient: "Patients",
        rendezVous: "Rendez Vous",
        session: "Sessions",
        users: "Users",
        setting: "Settings",
        logout: "Logout",
      },
      sessions: {
        title: "Session Records",
        single: {
          add: "Add Session"
        },
        table: {
          id: "ID",
          patient: "PATIENT",
          date: "DATE",
          price: "Price",
          note: "NOTE",
          actions: "ACTIONS"
        }
      },
      theme: {
        dark: "Dark",
        light: "Light"
      }
    }
  },
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
        }
      },
      theme: {
        dark: "Sombre",
        light: "Clair"
      }
    }
  },
  ar: {
    translation: {
      auth: {
        title: "إدارة العيادة",
        subtitle: "سجل الدخول إلى حسابك",
        username: "اسم المستخدم",
        password: "كلمة المرور",
        signIn: "تسجيل الدخول",
        authenticating: "جاري المصادقة...",
        errorInternal: "حدث خطأ أثناء تسجيل الدخول. تأكد من تشغيل الخادم.",
      },
      dashboard: {
        title: "لوحة تحكم العيادة",
        loggedInAs: "تم تسجيل الدخول كـ",
        logout: "تسجيل الخروج",
        welcomeTitle: "مرحباً بعودتك!",
        welcomeSubtitle: "لوحة تحكم إدارة العيادة الاحترافية الخاصة بك جاهزة.",
      },
      sidebar: {
        dashboard: "لوحة التحكم",
        patient: "المرضى",
        rendezVous: "المواعيد",
        session: "الجلسات",
        users: "المستخدمين",
        setting: "الإعدادات",
        logout: "تسجيل الخروج",
      },
      sessions: {
        title: "سجل الجلسات",
        single: {
          add: "إضافة جلسة"
        },
        table: {
          id: "ID",
          patient: "المريض",
          date: "التاريخ",
          price: "السعر",
          note: "ملاحظة",
          actions: "الإجراءات"
        }
      },
      theme: {
        dark: "داكن",
        light: "فاتح"
      }
    }
  }
};

const savedLanguage = localStorage.getItem('i18nextLng') || 'en';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
