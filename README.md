# Pulse Dispatch - Customer Journey Demo

This is a minimal Snoonu-style customer journey demo built with Next.js, TypeScript, and TailwindCSS.

## Project Structure
- `/app`: Next.js App Router pages (Home, Merchant, Cart, Checkout, Tracking).
- `/components`: Reusable UI components and Map logic.
- `/public/assets`: Static images (Logos, Products).

## How to Run
1.  **Install Dependencies**:
    Requires Node.js installed.
    ```bash
    npm install
    ```
2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
3.  **Open in Browser**:
    Navigate to `http://localhost:3000`.
    *Note: Designed for mobile view (390px width). The layout automatically centers a mobile frame on desktop.*

## Demo Flow & Modes
1.  **Home**: Click "Restaurants" or the generic promo to go to **HoyaCafe**.
2.  **Merchant**: Add "Bulldog cupcakes" to cart -> Click "View Cart".
3.  **Cart**: Review items -> "Go to Checkout".
4.  **Checkout**: Select a delivery mode:
    - **FAST (⚡)**: 35 min, 10 QAR. Direct Route.
    - **NORMAL (🎯)**: 45 min, 5 QAR. Direct Route.
    - **ECO (🍃)**: 60 min, Free. Route goes via nearest Hub (West Bay or Msheireb) for efficiency.
5.  **Tracking**:
    - Watch the rider move from HoyaCafe to your House.
    - **Fast Mode**: Add-on strip appears for 90s. Only Cupcakes allowed.
    - **Normal Mode**: Add-on strip for 2 min. Cupcakes + Stickers allowed.
    - **Eco Mode**: Add-on strip for 4 min. All allowed.
    - *Try adding an item to see the ETA and Total update!*

## Technical Details
- **Map**: Built with `react-leaflet` and OpenStreetMap tiles. No API key required.
- **Eco Logic**: Calculates the nearest hub (Education City, West Bay, or Msheireb) to the midpoint of the delivery and routes through it.
- **Rider Animation**: Linear interpolation along the polyline path.

## Assets
Assets are located in `/public/assets`:
- `hoyacafe-logo.png`
- `bulldog-cupcakes.png`
- `gumart-stickers.png`
