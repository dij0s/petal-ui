import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const defaultLanguage = localStorage.getItem("language") || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        prompt_placeholder: "Type your message here...",
        side_panel_close_label: "Close",
        side_panel_new_conversation_label: "New conversation",
        indicator_message_great: "Keep being green!",
        indicator_message_ok: "Try a bit more.",
        indicator_message_bad: "You could make an effort...",
      },
    },
    fr: {
      translation: {
        prompt_placeholder: "Tapez votre message ici...",
        side_panel_close_label: "Fermer",
        side_panel_new_conversation_label: "Nouvelle conversation",
        indicator_message_great: "Continuez à être vert !",
        indicator_message_ok: "Essayez un peu plus.",
        indicator_message_bad: "Vous pourriez faire un effort...",
      },
    },
    de: {
      translation: {
        prompt_placeholder: "Geben Sie hier Ihre Nachricht ein...",
        side_panel_close_label: "Schließen",
        side_panel_new_conversation_label: "Neues Gespräch",
        indicator_message_great: "Bleiben Sie weiterhin grün!",
        indicator_message_ok: "Versuchen Sie es ein wenig mehr.",
        indicator_message_bad: "Sie könnten sich mehr anstrengen...",
      },
    },
  },
  lng: defaultLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

// listen for language changes and store in localStorage
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("language", lng);
});

export default i18n;
