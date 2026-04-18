# Life Track AI - Project Context & Rules

## Tech Stack
- Framework: React Native (Expo)
- Routing: Expo Router (file-based navigation)
- Styling: NativeWind (Tailwind CSS for React Native)
- State Management: Zustand
- Database: `expo-sqlite` (Offline-first)
- Icons: `lucide-react-native`
- AI Provider: Groq Cloud API (Direct client call)

## Design System & UI/UX
- Theme: High-contrast Dark Athletic theme.
- Background Primary: `#121212`
- Background Card/Secondary: `#1E1E1E`
- Primary Brand Color (Buttons, Active states, Highlights): `#FF7A00` (Premium Orange)
- Shape Language: Heavily rounded corners (`rounded-2xl` for cards, `rounded-full` for pills/buttons).
- Typography: White text on dark backgrounds. No black text on dark gray.

## Architecture Rules
1. **Offline First**: All user data, workouts, and goals must be saved to `expo-sqlite`. 
2. **State Sync**: Zustand acts as the active UI memory. Any change to Zustand must trigger a background write to SQLite. Zustand must `hydrate()` from SQLite on app boot.
3. **AI Integration**: The Groq API is called directly from the client. The API key is stored in SQLite/Zustand (NEVER hardcoded). 
4. **AI UI Mutations**: When AI is asked to perform an action (e.g., "Add an exercise"), prompt the LLM to return STRICT JSON. Parse the JSON and trigger Zustand actions.
5. **Resilience**: If the app is offline or the Groq key is missing, disable AI inputs gracefully with tooltips. Fall back to manual UI inputs if AI JSON parsing fails.

## Coding Standards
- Use functional components and React Hooks.
- Do not use inline styles. Use NativeWind `className`.
- Do not use HTML tags (`div`, `span`). Use React Native tags (`View`, `Text`, `Pressable`).
- Wrap screens with inputs in `KeyboardAvoidingView`.
- Keep files under 300 lines of code. Split into smaller components if necessary.