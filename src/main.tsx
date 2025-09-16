import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log("Main: Starting app...");
const rootElement = document.getElementById("root");
console.log("Main: Root element found:", rootElement);

if (!rootElement) {
  console.error("Main: Root element not found!");
} else {
  try {
    const root = createRoot(rootElement);
    console.log("Main: Root created, rendering App...");
    root.render(<App />);
    console.log("Main: App rendered successfully");
  } catch (error) {
    console.error("Main: Error rendering app:", error);
  }
}
