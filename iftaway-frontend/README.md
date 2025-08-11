# IFTA WAY - Command Center

A modern, professional IFTA mileage and fuel tracking application for truckers.

## Features

- 📱 **Mobile-First Design** - Optimized for use on the road
- 🔥 **Firebase Backend** - Reliable, scalable cloud infrastructure
- 📊 **Smart Analytics** - Track miles, expenses, and fuel efficiency
- 🤖 **AI Receipt Scanning** - Automatically extract data from receipts
- 📈 **Detailed Reports** - Generate IFTA-compliant reports
- 🌙 **Dark/Light Mode** - Comfortable viewing in any condition
- 📴 **Offline Support** - Continue working without internet
- 🔐 **Secure Authentication** - Google Sign-in and email/password

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Firebase (Firestore, Functions, Auth, Storage)
- **AI**: Google Gemini for receipt scanning
- **Charts**: Recharts
- **Deployment**: Firebase Hosting

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase CLI
- Firebase project with enabled services

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd iftaway-frontend
   npm install
   ```
3. Set up Firebase configuration in `.env.production`
4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```

## Project Structure

```
iftaway-frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── views/         # Page components
│   ├── services/      # API and Firebase services
│   ├── utils/         # Utility functions
│   └── types/         # TypeScript definitions
├── functions/         # Firebase Cloud Functions
└── public/           # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Private - All rights reserved