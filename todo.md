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


## Sprint 2: Analytics & Autoregulation

### Analytics Dashboard
- [x] Create Analytics page with navigation
- [x] Implement e1RM progression line charts (per exercise)
- [x] Add volume tracking (sets × reps × weight) over time
- [x] Build muscle group distribution pie/bar charts
- [x] Add date range filters for analytics views
- [x] Display personal records (PRs) for each exercise

### Autoregulation Logic
- [x] Implement set addition algorithm based on RIR performance
- [x] Add feedback-based adjustments (soreness, pump, joint pain)
- [x] Create set recommendation system for microcycles
- [x] Add visual indicators for recommended set changes
- [x] Implement progressive overload tracking

### Workout Enhancements
- [x] Add rest timer with countdown
- [x] Implement browser notifications for rest periods
- [x] Add workout duration tracking
- [x] Create workout summary screen with session stats
- [x] Add quick-access to previous set data during logging

### Testing & Validation
- [x] Test e1RM calculation accuracy with sample data
- [x] Verify autoregulation logic with various feedback scenarios
- [x] Test analytics charts with multiple weeks of data
- [x] Validate rest timer and notifications


## Sprint 3: Advanced Features & UX Enhancements

### Workout History
- [x] Create dedicated History page with all completed sessions
- [x] Add timeline view with date filtering (week/month/all time)
- [x] Display session summaries with total volume and duration
- [ ] Implement session comparison feature
- [x] Add search and filter by exercise or muscle group

### Autoregulation Integration
- [x] Display set recommendations in ProgramDetail page
- [x] Show AutoregulationInsights component for each exercise in microcycles
- [x] Add visual indicators for recommended changes
- [x] Implement one-click apply recommendations
- [ ] Track when recommendations were last applied

### Deload Detection
- [x] Implement deload detection algorithm based on fatigue metrics
- [x] Add deload recommendation banner when needed
- [ ] Create deload week template with reduced volume
- [ ] Track recovery metrics during deload weeks
- [ ] Add manual deload week scheduling

### Exercise Notes & Templates
- [x] Add notes field to exercises for form cues
- [x] Implement workout templates for quick session creation
- [x] Add ability to duplicate previous sessions
- [ ] Create exercise substitution suggestions
- [ ] Add exercise video URL field

### UX Enhancements
- [x] Add skeleton loading states for all data fetching
- [x] Implement error boundaries with retry functionality
- [x] Add confirmation dialogs for destructive actions
- [x] Improve mobile navigation with bottom tab bar
- [ ] Add keyboard shortcuts for workout logging
- [ ] Implement undo functionality for recent actions

### Testing & Validation
- [x] Test workout history with multiple months of data
- [x] Verify deload detection accuracy
- [x] Test autoregulation integration in program flow
- [x] Validate all new features work offline


## Sprint 4: Templates, Comparisons & Polish

### Exercise Video Integration
- [x] Add video_url field to Exercise schema
- [x] Update exercise creation/edit forms with video URL input
- [x] Implement video player component for workout sessions
- [x] Add video preview in exercise library
- [x] Support YouTube, Vimeo, and direct video URLs

### Workout Templates
- [x] Create WorkoutTemplate table in database
- [ ] Add "Save as Template" button to completed sessions
- [x] Build template library page with search and filter
- [x] Implement "Create from Template" in program builder
- [ ] Add template sharing/export functionality

### Session Comparison
- [ ] Create comparison view component
- [ ] Add "Compare" button to history sessions
- [ ] Display side-by-side metrics (volume, e1RM, RIR)
- [ ] Show performance trends between sessions
- [ ] Add exercise-level comparison details

### Exercise Substitutions
- [ ] Build substitution suggestion algorithm
- [ ] Display alternative exercises by muscle group
- [ ] Add "Swap Exercise" button in workout sessions
- [ ] Track substitution history
- [ ] Suggest based on equipment availability

### Deload Week Templates
- [ ] Create deload template generator (50% volume reduction)
- [ ] Add "Schedule Deload" from deload banner
- [ ] Implement deload microcycle creation
- [ ] Track recovery metrics during deload
- [ ] Add post-deload performance comparison

### Final Polish
- [ ] Add keyboard shortcuts (Enter to log set, Esc to cancel)
- [ ] Implement undo last action functionality
- [ ] Add data validation and error messages
- [ ] Improve mobile responsiveness
- [ ] Add onboarding tutorial for first-time users

### Testing & Validation
- [ ] Test video player with various URL formats
- [ ] Verify template save/load workflow
- [ ] Test session comparison with real data
- [ ] Validate deload week generation
- [ ] Complete end-to-end user flow testing


## Sprint 5: Template Workflows & Comparisons

### Template Workflows
- [x] Add "Save as Template" button to History page sessions
- [x] Implement template creation from completed sessions
- [x] Add template selection dialog in program builder
- [x] Apply template exercises to new workout sessions
- [x] Display template preview before application

### Session Comparison
- [x] Create SessionComparison component
- [x] Add "Compare" button to History sessions
- [x] Implement session selection for comparison (2 sessions)
- [x] Display side-by-side exercise comparison
- [x] Show performance deltas (volume, e1RM, RIR)
- [x] Add comparison summary statistics
### Template Import/Export
- [x] Add template export to JSON
- [x] Implement template import with validation
- [x] Add template sharing functionality

### Testing & Validation
- [x] Test save-as-template workflow
- [x] Verify template application to sessions
- [x] Test session comparison with real data
- [x] Validate template import/export cycle