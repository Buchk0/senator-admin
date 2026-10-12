# Senator Hotel — admin panel

Web admin panel for the Senator Hotel mobile app. Hotel staff use it to manage everything guests see in the app — menus, photos, events, promotions, coupons and spa services — without a new app release.

The mobile app lives in a separate repository: [Buchk0/senator](https://github.com/Buchk0/senator). Both use the same Firebase project.

## Features

- **Sign-in for staff only** — access is granted to accounts with `role == 'admin'`; everyone else is redirected to the login page
- **Content sections** — coupons, promotions, events, spa services, restaurant photos (separate tabs for Senator and Balkon), menu pages, gallery
- **List and form per section** — create, edit, activate or hide, delete
- **Image upload** to Firebase Storage
- **Three content languages** — each text field is edited in English, Russian and Kazakh
- **Responsive layout** — sidebar on desktop, slide-out menu on mobile

## Tech stack

| Area | Technology |
|---|---|
| UI | React 18, TypeScript, Tailwind CSS |
| Routing | React Router 6 |
| Build | Vite |
| Backend | Firebase Auth, Cloud Firestore, Firebase Storage |

## Project structure

```
src/
  App.tsx                  Routes
  firebase.ts              Firebase initialization
  context/AuthContext.tsx  Current user and admin check
  components/
    ProtectedRoute.tsx     Redirects non-admins to /login
    Layout.tsx             Sidebar and page shell
    LangTabs.tsx           EN / RU / KZ switcher for form fields
  pages/
    Login.tsx
    Dashboard.tsx
    <section>/             List + Form for coupons, promotions, events, spa, photos, menu, gallery
  utils/seed*.ts           One-off scripts that filled the database with initial content
```

## Running locally

```bash
npm install
npm run dev
```

Firebase settings are read from `VITE_FIREBASE_*` variables in a local `.env` file; see `.env.example`.
