# UPSC AI Mentor Mobile App

A comprehensive React Native mobile application for UPSC (Union Public Service Commission) preparation powered by AI and integrated with Supabase backend.

## Features

- 📚 **Study Materials**: Comprehensive UPSC study resources
- 🎯 **Mock Tests**: Practice tests with AI-powered analytics
- 📊 **Progress Tracking**: Detailed performance analytics
- 💬 **Answer Writing Lab**: AI-assisted answer writing practice
- 🔄 **Current Affairs**: Daily current affairs updates
- 📱 **AR Visualization**: 3D visual learning experiences
- 💳 **Subscription Management**: RevenueCat integration for in-app purchases
- 🔐 **Admin Dashboard**: Comprehensive admin panel for content management

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase
- **Authentication**: Supabase Auth + Google Sign-In
- **Database**: PostgreSQL (via Supabase)
- **State Management**: React Context API
- **Navigation**: React Navigation
- **Payments**: RevenueCat
- **Analytics**: Google Analytics
- **Build**: Expo Application Services (EAS)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- EAS CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/aimasteryedu/upsc-ai-mentor-mobile-app.git
cd upsc-ai-mentor-mobile-app
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Install global CLI tools:
```bash
npm install -g @expo/cli eas-cli
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# RevenueCat
EXPO_PUBLIC_REVENUECAT_API_KEY=your_revenuecat_api_key

# Google Services
GOOGLE_ADS_API_KEY=your_google_ads_api_key
GOOGLE_OAUTH_CLIENT_ID=your_oauth_client_id

# Meta Ads
META_ADS_ACCESS_TOKEN=your_meta_ads_token

# OpenAI
LLM_PROVIDER_KEY=your_openai_api_key
```

### Google Services

Place your `google-services.json` file in the root directory. Download this from your Firebase console.

### EAS Build Setup

1. Login to EAS:
```bash
eas login
```

2. Configure build:
```bash
eas build:configure
```

## Development

### Start the development server:
```bash
npx expo start
```

### Run on specific platforms:
```bash
npx expo start --android
npx expo start --ios
npx expo start --web
```

## Building

### APK (for testing):
```bash
eas build --platform android --profile preview
```

### AAB (for Play Store):
```bash
eas build --platform android --profile production
```

### iOS:
```bash
eas build --platform ios
```

## Deployment

### Submit to Google Play Store:
```bash
eas submit --platform android
```

### Submit to Apple App Store:
```bash
eas submit --platform ios
```

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components
│   ├── services/           # API and external services
│   ├── navigation/         # Navigation configuration
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript definitions
├── assets/                 # Images, fonts, etc.
├── app.json               # Expo configuration
├── eas.json               # EAS build configuration
└── package.json           # Dependencies
```

## Backend Integration

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL migrations in the `supabase/migrations/` directory
3. Configure authentication providers
4. Set up storage buckets for app assets

### Edge Functions

Deploy Supabase Edge Functions:
```bash
supabase functions deploy
```

## API Services

### Authentication
- Supabase Auth for user management
- Google OAuth for social login
- JWT token handling

### Database
- PostgreSQL via Supabase
- Real-time subscriptions
- Row Level Security (RLS)

### AI Integration
- OpenAI GPT integration for answer evaluation
- Content generation and analysis
- Personalized study recommendations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@aimasteryedu.com or create an issue on GitHub.

## Build Status

- ✅ Development builds: Working
- ⏳ Preview builds: In progress
- ⏳ Production builds: Pending

## Play Store Information

- **Package Name**: `com.upscai.mentor`
- **Version**: `1.0.0`
- **Build Tools**: Gradle 8.0+
- **Target SDK**: Android 34
- **Min SDK**: Android 21