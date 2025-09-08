import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enLoginPage from "./locales/en/loginPage.json";
import enSignUpPage from "./locales/en/signUpPage.json";

import viLoginPage from "./locales/vi/loginPage.json";
import viSignUpPage from "./locales/vi/signUpPage.json";

import enForgotPasswordPage from "./locales/en/forgotPasswordPage.json";
import viForgotPasswordPage from "./locales/vi/forgotPasswordPage.json";

import enOnboardingPage from "./locales/en/onboardingPage.json";
import viOnboardingPage from "./locales/vi/onboardingPage.json";

import enProfilePage from "./locales/en/profilePage.json";
import viProfilePage from "./locales/vi/profilePage.json";

import enChangePasswordPage from "./locales/en/changePasswordPage.json";
import viChangePasswordPage from "./locales/vi/changePasswordPage.json";

import enSidebar from "./locales/en/sidebar.json";
import viSidebar from "./locales/vi/sidebar.json";

import enHomePage from "./locales/en/homePage.json";
import viHomePage from "./locales/vi/homePage.json";

import enFriendsPage from "./locales/en/friendsPage.json";
import viFriendsPage from "./locales/vi/friendsPage.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        loginPage: enLoginPage,
        signUpPage: enSignUpPage,
        forgotPasswordPage: enForgotPasswordPage,
        onboardingPage: enOnboardingPage,
        profilePage: enProfilePage,
        changePasswordPage: enChangePasswordPage,
        sidebar: enSidebar,
        homePage: enHomePage,
        friendsPage: enFriendsPage,
      },
      vi: {
        loginPage: viLoginPage,
        signUpPage: viSignUpPage,
        forgotPasswordPage: viForgotPasswordPage,
        onboardingPage: viOnboardingPage,
        profilePage: viProfilePage,
        changePasswordPage: viChangePasswordPage,
        sidebar: viSidebar,
        homePage: viHomePage,
        friendsPage: viFriendsPage,
      },
    },
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    ns: [
      "loginPage",
      "signUpPage",
      "forgotPasswordPage",
      "onboardingPage",
      "profilePage",
      "changePasswordPage",
      "sidebar",
      "homePage",
      "friendsPage",
    ],
    defaultNS: "loginPage", // Default namespace
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
