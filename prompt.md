phase 1 testing

chef screen has duplicate back button, the top left back button is white which is off



PROMPT 5: Context Injection (The Global Brain)

/plan
@workspace Upgrade `src/services/ai.ts` to implement Context Injection. The AI must inherently know the user's profile before answering any prompt.

1. Fetch the `profile` object and `weightHistory` from `useUserStore.getState()`. Fetch `activeGoals` from `useGoalStore.getState()`. Fetch `activeWorkout` from `useWorkoutStore.getState()`.
2. Construct a `systemContextString`: 
   `"You are Life Track AI, an elite fitness and nutrition coach. The user is ${profile.name}. Current Weight: ${profile.currentWeight}kg. Primary Goal: ${profile.primaryGoal}. Allergies: ${profile.allergies}. Tone Preference: ${profile.aiTone}. Active Goals: ${JSON.stringify(activeGoals)}."`
3. If `activeWorkout` exists, append: `"Currently doing workout: ${activeWorkout.name}."`
4. Update `sendPrompt()` to inject this `systemContextString` as the *first* message in the Groq `messages` array (with `role: "system"`), followed by the optional `schemaInstruction` (also as a system message), and finally the user's prompt.
5. Add robust error handling (try/catch block) around the `fetch` call to prevent app crashes on network timeouts. Return a fallback JSON object if the call fails.

Checklist:
- [ ] System context dynamically reads from Zustand.
- [ ] Groq receives the user's profile data silently on every request.
- [ ] Network errors return a safe JSON fallback instead of crashing.



PROMPT 6: Morning Weight Tracker


/fleet
@workspace Build the Morning Weight tracking feature in a new screen `app/weight.tsx` (accessible from the Hub tab).

1. Screen layout: Use `KeyboardAvoidingView` and `ScrollView`.
2. Header: "Morning Weight" (use native Expo Router stack header).
3. Input section: A large, centered numerical `Input` for weight (kg), and a smaller text `Input` for optional notes (e.g., "Ate late last night").
4. Button: A primary "Log Weight" button. On press, call `useUserStore.getState().logMorningWeight(weight, notes)`. Show a success Toast/Alert and clear the input.
5. History section: Render a `FlatList` of the user's `weightHistory` from Zustand. Sort by date descending. 
6. History Card: For each entry, show the Date, Weight, and Notes in a clean, dark-themed glassmorphism card (`bg-card`, rounded corners, subtle border).

Checklist:
- [ ] Weight input uses a numeric keyboard.
- [ ] Logging a weight immediately updates the history list via Zustand.
- [ ] The profile's `currentWeight` is updated globally.



PROMPT 7: Proper Chef AI Overview


/plan
@workspace Completely rebuild `app/chef.tsx` to utilize the new AI Context and create a beautiful, clean UI.

1. Layout: Split vertically. Top 50% is a Chat UI (messages array in state). Bottom 50% is a `ScrollView` containing an "Interactive Recipe" view.
2. When the user asks for a recipe (e.g., "Give me a high protein breakfast"), send the prompt to `aiService.ts` with a strict JSON schema:
   `"{ action: 'RECIPE', payload: { name: string, macros: { calories: number, protein: number }, ingredients: string[], steps: string[] }, message: string }"`
3. Parse the AI response. Display the `message` string in the Chat UI. 
4. Update local state with the `payload` to render the Interactive Recipe view:
   - Header: Recipe Name + Macros (Calories/Protein) in pill badges.
   - Ingredients: A simple bulleted list.
   - Steps: A numbered list with a custom `Pressable` Checkbox next to each step.
5. Behavior: When a user checks a step, strike through the text, reduce opacity, and automatically append an AI message to the Chat UI: "Great job completing step X!"

Checklist:
- [ ] Chef AI returns structured JSON containing macros, ingredients, and steps.
- [ ] The Chef knows about the user's allergies (via Context Injection).
- [ ] Checking off steps triggers an ambient AI response.


PROMPT 8: Keyboard & Navigation Polish (Hub & Links)



/review
@workspace Audit the navigation and keyboard safety across the new screens.

1. In `app/(tabs)/hub.tsx`, create beautiful, large, glassmorphism `Pressable` cards (`bg-card`, padding, rounded-2xl, lucide icon) that use Expo Router's `router.push()` to navigate to `/weight`, `/statistics` (placeholder for now), and `/profile` (placeholder for now).
2. Audit `app/chef.tsx` and `app/weight.tsx`: Ensure the main content is wrapped in a `KeyboardAvoidingView` with `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` and `keyboardVerticalOffset={100}` so the inputs are never hidden.
3. Ensure all screens outside `(tabs)` have `headerStyle: { backgroundColor: '#121212' }, headerTintColor: '#FF7A00'` defined in `app/_layout.tsx` so the native headers match the dark athletic theme.

Checklist:
- [ ] Hub tab has functional links to the new screens.
- [ ] Keyboards do not overlap text inputs anywhere in the app.
- [ ] Native headers match the app's color scheme.



phase 2 checks

Open the Hub tab and tap Morning Weight. Enter a new weight (e.g., 85kg). Verify it appears in the history list below.

Go to the Chef screen. Ask it: "Suggest a dinner recipe."

The Magic Test: Because of Context Injection, the Chef should automatically calculate the calories/macros based on the goal (e.g., Muscle Gain) and the weight (85kg) you just entered, without you having to tell it.




PROMPT 9: Workout Days & Free Mode (The Hierarchy)



/plan
@workspace Upgrade `src/store/useWorkoutStore.ts` to support "Workout Days" (e.g., Push Day) and "Free Mode", matching the Gym Tracker architecture.

1. Add state: `workoutDays` (Array of `{ id, name, last_played }`), `activeDayId` (string | null), `sessionDuration` (number), `isTimerRunning` (boolean).
2. Add actions: `createWorkoutDay(name)`, `startWorkoutDay(dayId)`, `startFreeWorkout()`, `finishWorkout()`.
3. `startFreeWorkout()` sets `activeDayId` to `null` and initializes an empty `activeWorkout` session.
4. `startWorkoutDay(dayId)` fetches all `exercises` for that `dayId` from SQLite, sets `activeDayId`, and initializes `activeWorkout`.
5. Update `finishWorkout()` to calculate the `total_score` (sum of all set scores), `INSERT` a record into `workout_sessions`, and if `activeDayId` is not null, `UPDATE workout_days SET last_played = ?`. Clear the active session.

Checklist:
- [ ] Zustand handles the `day_id` relational hierarchy.
- [ ] Free Mode bypasses the hierarchy but still tracks the session.
- [ ] Finishing a workout saves the total score to SQLite.


PROMPT 10: The Scoring Formula & Quick Reps UI



/fleet
@workspace Implement the Gym Tracker scoring formula and the Quick Reps UI in `app/workout.tsx` and `src/components/ExerciseCard.tsx`.

1. Create `src/utils/scoring.ts`. Export `calculateSetScore(reps: number, weight: number): number`. Formula: If weight <= 1 or reps <= 0, return 0. Otherwise, return `reps * Math.log10(weight)`.
2. In `ExerciseCard.tsx`, update the Set Input UI. Below the standard text input for `reps`, add a horizontal row of 4 small "Quick Rep" pills: `[ 6 ] [ 8 ] [ 10 ] [ 12 ]`. 
3. Tapping a Quick Rep pill instantly updates the `reps` input value for that specific set and triggers `updateSet()`.
4. In `useWorkoutStore.ts`, when `updateSet(exerciseId, setId, data)` is called, if `reps` and `weight` are present, automatically calculate the `score` using the utility function and save it to the set.

Checklist:
- [ ] `Math.log10` formula is implemented correctly.
- [ ] Quick Rep pills (`bg-card`, text-white, rounded-full) are visible and functional.
- [ ] Zustand automatically calculates the set score on update.



PROMPT 11: Set Failure Logic & Timers


/plan
@workspace Add "Mark Failure" logic and "Timed Workout" auto-reset to `src/components/ExerciseCard.tsx`.

1. In the Set Input UI, next to the "Completed" checkbox, add a "Mark Failure" toggle (a Lucide `XCircle` icon that turns red `#e57373` when active).
2. If "Mark Failure" is toggled ON: update the set's `is_failure` flag to 1, automatically mark the set as `completed`, and collapse the `ExerciseCard` (or scroll to the next exercise) to signal the end of that movement.
3. Implement Timed Exercises: If `exercise.is_timed` is true (e.g., Planks), replace the "Reps/Weight" inputs with a large, centered Timer UI (MM:SS).
4. Timer Logic: A "Start/Stop" button. When the timer is stopped, the elapsed seconds are saved as the `reps` value (weight = 0, score = 0). Automatically reset the timer UI to 00:00 for the *next* set.

Checklist:
- [ ] Failure toggle works and visually updates to red.
- [ ] Marking failure ends the exercise gracefully.
- [ ] Timed exercises store seconds in the reps column and auto-reset.



PROMPT 12: Workout Hub & History


/fleet
@workspace Build the entry point for workouts in `app/(tabs)/index.tsx` (Home) and a new `app/workout-history.tsx` screen.

1. On the Home Dashboard, replace the "Log Workout" button with two distinct, large buttons: "Start Free Workout" (navigates to `/workout` and calls `startFreeWorkout()`) and "My Programs" (opens a modal or new screen to select a `workout_day`).
2. Build `app/workout-history.tsx` (accessible from the Hub tab). 
3. Query the `workout_sessions` table (joined with `workout_days` to get the name, or "Free Workout" if null). 
4. Render a `FlatList` of past sessions. Show the Date, Duration (formatted), and Total Score. 
5. Use glassmorphism cards (`bg-card`, rounded-2xl, subtle padding) for the history list.

Checklist:
- [ ] Home screen clearly differentiates Free Mode from Planned Days.
- [ ] History screen successfully reads and displays past sessions from SQLite.
- [ ] Duration and Scores are formatted cleanly (e.g., `1h 15m`, `Score: 4,520`).





phase 3 tests


Free Mode: Go to the Home screen and tap Start Free Workout.

The Mutator & Quick Reps: In the Workout screen, use the AI input bar: "Add 3 sets of Bench Press". When the card appears, expand it. Tap the [ 8 ] Quick Rep pill. Verify the rep input updates instantly. Enter a weight (e.g., 100).

The Failure Toggle: Tap the Mark Failure icon (XCircle). The set should complete and the card should ideally collapse or visually indicate you are done.

The Score: Tap Finish Workout. Go to the Hub -> Workout History. You should see a "Free Workout" logged with a Total Score > 0 (because 8 * log10(100) = 16).



PROMPT 13: Statistical Engine (Analytics Layer)


/plan
@workspace Build the analytical data layer in `src/utils/analytics.ts` to power the Statistics screen.

1. Install `react-native-gifted-charts`.
2. Create `src/utils/analytics.ts`. Export async functions that query SQLite:
   - `getLifetimeScore()`: SUM of `total_score` from `workout_sessions`.
   - `getTotalWorkouts()`: COUNT of `id` from `workout_sessions`.
   - `getRecentSessions()`: Returns the last 10 `workout_sessions` (date and totalScore) formatted for a Line Chart (e.g., `[{value: 50, label: 'Mon'}, ...]`).
   - `getDayFrequency()`: Joins `workout_sessions` and `workout_days` to return a count of how many times each planned day was completed, formatted for a Bar Chart.
3. Ensure these queries handle `NULL` values safely (e.g., Free Workouts have no `day_id`).

Checklist:
- [ ] Queries are optimized for SQLite.
- [ ] Data is correctly formatted for Gifted Charts (value/label objects).


PROMPT 14: Statistics Dashboard UI



/fleet
@workspace Build `app/statistics.tsx` (accessible from the Hub tab) using `react-native-gifted-charts`.

1. Layout: A `ScrollView` with `KeyboardAvoidingView`. Use a dark, premium theme (`bg-dark`).
2. Top Header: Two side-by-side glassmorphism cards (`bg-card`, rounded-2xl, p-4). Card 1 shows "Lifetime Score" (large orange text). Card 2 shows "Total Workouts" (large white text).
3. Section 1: "Recent Performance". Render a smooth, curved `LineChart` from `react-native-gifted-charts`.
   - Line color: `#FF7A00` (Brand Orange).
   - Area fill: Use a subtle vertical gradient (Orange to Transparent).
   - Hide the Y-axis rules/grid lines for a cleaner, cinematic look.
4. Section 2: "Workout Distribution". Render a `BarChart` showing the frequency of planned days vs. free workouts.
   - Bar color: `#333333` (Dark Gray), active/highest bar is `#FF7A00`.
   - Rounded tops on the bars.
5. Use `useFocusEffect` to call the analytics functions from Prompt 13 when the screen comes into view.

Checklist:
- [ ] Charts render beautifully against the dark background.
- [ ] Data loads dynamically from SQLite.
- [ ] Tooltips or labels are visible on chart tap.




PROMPT 15: The Cinematic Flow Carousel (Horizontal Scroll & Slider)



/plan
@workspace Rebuild `app/(tabs)/flow.tsx` to match the exact behavior of the `legacy/flow.html` prototype, but using React Native Reanimated.

1. Install `react-native-reanimated`.
2. Cards: Render a horizontal `ScrollView` (`horizontal={true}`, `pagingEnabled={false}`, `showsHorizontalScrollIndicator={false}`, `snapToInterval={screenWidth * 0.75 + 16}`).
3. Each Card should be 75% of the screen width, `bg-card/30` (translucent), with a background image (use `ImageBackground` with `blurRadius={5}` and a dark overlay).
4. The Slider: Pin a custom track to the bottom of the screen (`h-1`, `bg-gray-800`, width 90%). 
5. Use `useAnimatedScrollHandler` to track the `ScrollView`'s `contentOffset.x`.
6. Bind a floating "Thumb" (`w-10`, `h-3`, `bg-brand`, `rounded-full`) to move along the track proportionally based on the scroll percentage.

Checklist:
- [ ] Cards snap cleanly to the center of the screen.
- [ ] The bottom slider thumb moves left/right perfectly in sync with the horizontal scroll.
- [ ] Translucent backgrounds and blurred images give a cinematic feel.



PROMPT 16: The Final UI Polish & Keyboard Hardening



/review
@workspace Run a global audit on all screens (`app/`, `app/(tabs)/`, `src/components/`) to finalize the premium aesthetic and fix edge cases.

1. Spacing & Borders: Ensure all cards (`bg-card`) have a consistent `rounded-2xl` radius and a subtle 1px border (`border-white/10`) to create a glassmorphism effect.
2. Typography: Check all `Text` components. Titles should be `font-bold` and white. Subtitles should be `text-gray-400`. Numbers (Scores, Reps, Weights) should be `text-brand` (Orange) for emphasis.
3. Safe Area: Wrap all main screens in `SafeAreaView` from `react-native-safe-area-context` so content doesn't overlap the iOS notch or Android status bar.
4. Active States: Ensure the bottom tab bar icons use `#FF7A00` when active, and `#555555` when inactive.
5. Loading: Add a centered `ActivityIndicator` (color: `#FF7A00`) to the Statistics and History screens while SQLite data is fetching.

Checklist:
- [ ] Glassmorphism borders are applied consistently.
- [ ] Orange accents highlight key data points.
- [ ] Safe areas prevent UI overlap.



phase 4 tests

Open the Hub -> Statistics. Are the charts rendering smoothly? (You may need to log a dummy workout or two to see the lines).

Open Flow. Scroll left and right. Does the bottom slider move in sync? Do the cards blur and snap correctly?

Turn off Wi-Fi and open Chef. Does it gracefully handle the network error without crashing the app?