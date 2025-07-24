import {genkit} from 'genkit';
import 'dotenv/config';

// This is a placeholder for Genkit initialization.
// The googleAI plugin has been removed to eliminate the Gemini API key dependency.
// If you add other Genkit plugins in the future, you can configure them here.
export const ai = genkit({
  plugins: [],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
