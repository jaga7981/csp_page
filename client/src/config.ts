// Use VITE_API_URL environment variable if available, otherwise fallback to localhost
// This allows the app to work seamlessly both locally and on Vercel
// Use VITE_API_URL environment variable if available, otherwise fallback to relative path in PROD or localhost in DEV
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');
