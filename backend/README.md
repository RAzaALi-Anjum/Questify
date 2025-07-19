# Questify Backend

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create a `.env` file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/questify
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   FRONTEND_URL=http://localhost:3000
   ```

3. **Run the server:**
   ```bash
   node index.js
   ```

4. **Set up Google OAuth and Stripe:**
   - Create Google OAuth credentials and set redirect URI to `http://localhost:5000/auth/google/callback`
   - Create Stripe products and get price IDs for monthly/yearly plans

## API Endpoints
- `POST /auth/google` - Google login
- `GET /usage` - Get remaining tries
- `POST /usage/use-model` - Use a try
- `POST /pay` - Create Stripe checkout session
- `POST /pay/webhook` - Stripe webhook 