# KAJJ-HAVEEKO's Food Ordering System

A modern, real-time food ordering and management system built with React, TypeScript, Firebase, and Google Sheets integration. The system provides a seamless experience for customers to place orders and administrators to manage orders, menu items, inventory, and track business analytics.

## Features

### Customer Features
- **Intuitive Order Form**
  - Easy menu item selection with quantity controls
  - Real-time stock availability checking
  - Multiple payment methods (Cash, Online, Payday)
  - Convenient GCash number access
  - Dynamic announcements display
  - Order validation and error handling

### Admin Features
- **Order Management**
  - Real-time order tracking
  - Order status updates
  - Payment status management
  - Order filtering and search
  - Bulk order operations

- **Menu Management**
  - Category-based organization
  - Stock level tracking
  - Image upload support
  - Pricing management
  - Category color customization

- **Analytics & Reporting**
  - Sales trends visualization
  - Revenue analytics
  - Order statistics
  - Inventory monitoring
  - Google Sheets export integration

- **System Settings**
  - GCash number management
  - Announcement configuration
  - Category customization
  - Auto-export scheduling

## Technology Stack

- **Frontend**
  - React 18
  - TypeScript
  - Tailwind CSS
  - Vite
  - Lucide React Icons

- **Backend & Services**
  - Firebase (Firestore)
  - Firebase Storage
  - Google Sheets API
  - Firebase Authentication

## Setup Instructions

1. Clone the repository
```bash
git clone [repository-url]
cd kajj-haveekos-food-ordering
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Create a `.env` file with the following configurations:
```env
# Google Configuration
VITE_GOOGLE_CLIENT_EMAIL=your-client-email
VITE_GOOGLE_PRIVATE_KEY=your-private-key
VITE_GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_GOOGLE_CLIENT_SECRET=your-client-secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/oauth2callback
VITE_GOOGLE_API_KEY=your-api-key

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

4. Start development server
```bash
npm run dev
```

5. Build for production
```bash
npm run build
```

## Project Structure

```
src/
├── components/         # React components
├── context/           # Context providers
├── hooks/             # Custom React hooks
├── services/          # API and service integrations
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── main.tsx          # Application entry point
```

## Deployment

The application is configured for deployment on Netlify with the following features:
- Automatic builds from main branch
- Environment variable management
- Custom domain support
- SSL/TLS encryption
- Redirect handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact the development team or create an issue in the repository.