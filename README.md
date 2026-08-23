# QuickHaul - Porter-like Logistics App

## Project Structure
```
porter/
├── backend/          → Node.js + Express + MongoDB API
├── customer-app/     → React Native (Customer)
├── driver-app/       → React Native (Driver)
├── admin-panel/      → React.js Web Admin
└── package.json      → Root scripts
```

## Quick Start

### 1. Setup Environment
```bash
cd backend
cp .env.example .env
# Fill in your keys in .env
```

### 2. Install & Run Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

### 3. Run Admin Panel
```bash
cd admin-panel
npm install
npm start
# Runs on http://localhost:3000
# Login: admin@porter.com / Admin@123
```

### 4. Run Mobile Apps
```bash
# Customer App
cd customer-app
npm install
npx react-native run-android   # or run-ios

# Driver App
cd driver-app
npm install
npx react-native run-android   # or run-ios
```

### Run Everything (Backend + Admin)
```bash
# From root
npm install
npm start
```

## API Base URL
- Development: `http://localhost:5000/api`
- Update in: `customer-app/src/utils/api.js` and `driver-app/src/utils/api.js`

## Admin Credentials
- Email: `admin@porter.com`
- Password: `Admin@123`
- Set in `.env` file

## Tech Stack
- **Backend**: Node.js, Express, MongoDB, Socket.io
- **Mobile**: React Native (iOS + Android)
- **Admin**: React.js + Recharts
- **Payments**: Razorpay
- **Maps**: Google Maps API
- **Notifications**: Firebase FCM
- **Auth**: JWT + OTP (MSG91)
