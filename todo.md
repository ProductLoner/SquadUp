# HypertrophyOS TODO

## Sprint 1: The Offline-First Core

### Database & Core Infrastructure
- [x] Install Dexie.js and required dependencies
- [x] Define database schema with Mesocycles, Exercises, Logs, Microcycles, and WorkoutSessions tables
- [x] Create database initialization and migration logic
- [x] Implement database utility functions and hooks

### Exercise Library
- [x] Create Exercise list view with search and filter
- [x] Implement Add Exercise form with muscle group selection
- [x] Build Edit Exercise functionality
- [x] Add Delete Exercise with confirmation
- [x] Include pre-seeded exercise library with common movements

### Program Builder (Mesocycles & Microcycles)
- [x] Create Mesocycle creation form (phase type, duration, set addition frequency)
- [x] Build Mesocycle list view with active/archived states
- [x] Implement Microcycle (weekly) management within Mesocycles
- [x] Add exercise assignment to Microcycles with set/rep/RIR targets
- [x] Create program overview/calendar view

### Workout Session Interface
- [x] Build workout session start screen (queue-based selection)
- [x] Implement live set logging interface (weight, reps, RIR)
- [x] Add feedback collection (soreness, pump, joint pain)
- [x] Create session completion flow
- [x] Display session history and progress

### PWA & Offline Support
- [x] Configure Vite PWA plugin with service worker
- [x] Add manifest.json with app metadata and icons
- [x] Implement offline-first data persistence
- [x] Test airplane mode functionality

### Data Export
- [x] Create Settings page
- [x] Implement JSON export functionality
- [x] Implement CSV export functionality
- [x] Add import functionality for backup restoration

### UI/UX Polish
- [x] Implement dark mode theme (high contrast for gym lighting)
- [x] Create responsive mobile-first layout
- [x] Add navigation structure (bottom nav or sidebar)
- [x] Implement loading states and error handling
- [x] Add empty states for all vi### Testing & Validation
- [x] Test complete workout flow (2 weeks, 8 sessions)
- [x] Verify offline functionality in airplane mode
- [x] Validate e1RM calculations
- [x] Test data export/import cyclesistence across browser sessions
