# BeerFinder Frontend

This is the frontend application for BeerFinder, built with React and TypeScript.

## What is React?

React is a JavaScript library (framework) created by Facebook for building user interfaces (the parts of a website that users see and interact with). Think of it like building blocks - you create small, reusable pieces (called "components") that you can combine to build a complete web page.

## What is TypeScript?

TypeScript is a programming language that extends JavaScript by adding "types". Types help catch errors before your code runs, making your code more reliable and easier to understand. It's like having a spell-checker for your code.

## Project Structure

```
frontend/
├── public/          # Static files (HTML, images, etc.)
├── src/
│   ├── components/  # Reusable UI pieces (like buttons, maps)
│   ├── pages/       # Full page components
│   ├── services/    # Code that talks to the backend API
│   ├── types/       # TypeScript type definitions
│   ├── utils/       # Helper functions
│   ├── App.tsx      # Main application component
│   └── index.tsx    # Entry point of the application
├── package.json     # List of dependencies (libraries we use)
└── tsconfig.json    # TypeScript configuration
```

## Key Concepts

### Components
Components are like LEGO blocks for your website. Each component represents a piece of the user interface. For example:
- `MapComponent` - Shows the interactive map
- `MapPage` - The full page that contains the map

### API (Application Programming Interface)
An API is like a waiter in a restaurant. You (the frontend) tell the waiter (API) what you want, and the waiter goes to the kitchen (backend) to get it for you. In our case:
- The frontend asks the API for POIs (Points of Interest)
- The API goes to the database and gets the POIs
- The API brings the POIs back to the frontend
- The frontend displays them on the map

### State
State is like the memory of your application. It remembers things like:
- Which POIs are currently displayed
- Whether the map is loading
- What the user clicked on

## Dependencies

The main libraries we use:

- **react** & **react-dom**: The core React library
- **react-router-dom**: For navigating between pages
- **react-leaflet** & **leaflet**: For displaying interactive maps
- **axios**: For making HTTP requests to the backend API
- **typescript**: The TypeScript language (version 4.9.5 for compatibility)
- **ajv**: JSON schema validator (required dependency)

## API Configuration

The frontend automatically detects the API URL based on where you're accessing the application:

- **From localhost**: Uses `http://localhost:8000/api/v1`
- **From network IP**: Uses `http://[server-ip]:8000/api/v1`
- **Auto-detection**: Uses `window.location.hostname` to determine the correct API URL

This allows the application to work seamlessly whether accessed from:
- The same machine (localhost)
- Another device on your local network
- Any IP address

The API URL is logged to the console in development mode for debugging.

## Running the Application

### Development Mode

```bash
cd frontend
npm install  # Install all dependencies
npm start    # Start the development server
```

The app will open at http://localhost:3000

### Building for Production

```bash
npm run build
```

This creates an optimized version of your app in the `build/` folder.

## How It Works

1. **User opens the website** → `index.html` loads
2. **React starts** → `index.tsx` renders the `App` component
3. **App component** → Sets up routing and shows the `MapPage`
4. **MapPage** → Displays the header and the `MapComponent`
5. **MapComponent** → 
   - Loads POIs from the API using `POIService`
   - Displays them on an interactive map using Leaflet
   - Allows users to click on the map to create new POIs

## Making Changes

When you make changes to the code:
- The development server automatically refreshes the page
- You'll see your changes immediately (this is called "hot reloading")

## Common Tasks

### Adding a New Component

1. Create a new file in `src/components/` (e.g., `MyComponent.tsx`)
2. Write your component code
3. Import and use it in other components

### Calling the Backend API

Use the services in `src/services/`:
```typescript
import POIService from './services/poiService';

// Get all POIs
const pois = await POIService.getAllPOIs();

// Create a new POI
const newPOI = await POIService.createPOI({
  name: 'My POI',
  description: 'A cool place',
  latitude: 51.505,
  longitude: -0.09
});
```

## Troubleshooting

### Port 3000 already in use
Change the port by setting the PORT environment variable:
```bash
PORT=3001 npm start
```

### Dependencies not installing
Try deleting `node_modules` and `package-lock.json`, then run `npm install` again.

### TypeScript version conflicts
- We use TypeScript 4.9.5 (compatible with react-scripts 5.0.1)
- If you see version conflicts, check `package.json` for the correct version

### API connection errors
- Check browser console (F12) for the API URL being used
- Verify the backend is running: `docker-compose ps backend`
- Check CORS settings in backend if accessing from network
- The frontend auto-detects the hostname, so it should work from any IP

### Leaflet icon errors
- Icons are loaded using `require()` in `leafletFix.ts`
- If icons don't appear, check browser console for errors
- Icons are automatically fixed on component load
