# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ECS System v2.1** - Sistema de Gestão de Capacity (Capacity Management System)

A Firebase-based web application for managing professional resource allocation and project capacity planning. The system tracks professionals, projects, allocations, and provides comprehensive dashboards with timeline visualizations.

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6 modules), HTML5, TailwindCSS
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Charts**: Google Charts API, Chart.js with ChartDataLabels plugin
- **Notifications**: Toastify.js
- **Authentication**: Google OAuth via Firebase Auth

## Architecture

### Single-Page Application Structure

The application is a client-side SPA with view-based navigation:
- All views are defined in `index.html` with `.view` class (hidden by default)
- Navigation handled by `switchView()` function in `app.js`
- Views: Dashboard, Profissionais, Projetos, Alocações, Timeline, Gerenciar Usuários

### Firebase Data Model

Data is stored in Firestore at path: `artifacts/{projectId}/public/data/{collection}`

**Collections:**
- `profissionais` - Professionals with profile, team, leader, seniority, active status
- `projetos` - Projects with client, type, dates (planned/actual), hours, status
- `alocacoes` - Allocations linking professionals to projects with percentage, dates, hours
- `users` - User roles (admin, editor, viewer)

### Real-time Data Flow

The app uses Firestore real-time listeners (`onSnapshot`) to sync data:
1. `setupRealtimeListeners()` establishes listeners for all collections
2. Data flows into `appState` object (lines 13-18 in app.js)
3. Changes trigger render functions: `renderProfissionais()`, `renderProjetos()`, `renderAlocacoes()`, `updateDashboard()`

### Role-Based Access Control

Three roles managed via `users` collection:
- **admin**: Full access including user management
- **editor**: Can create/edit/delete data (default role)
- **viewer**: Read-only access
- First user automatically becomes admin (lines 156-157 in app.js)

### Key Business Logic

**Allocation Calculations (lines 566-625 in app.js):**
- Supports overlapping allocations (e.g., 50% + 50% = 100%)
- Detects overload when total > 100%
- Special handling for "Férias" (vacation) projects - treated as 100% allocation
- Period filtering shows peak allocation vs. current allocation

**Availability Search (lines 1389-1466 in app.js):**
- Searches for professionals with capacity in a date range
- Filters by profile/perfil
- Excludes vacation time from availability

**Timeline Visualization (lines 1617-1772 in app.js):**
- Google Charts Timeline showing allocations per professional
- Vacation allocations split overlapping project allocations
- Color-coded by project

## Development Commands

### Firebase Deployment

```bash
# Deploy to default environment (dev)
firebase deploy

# Deploy to production
firebase use prd && firebase deploy

# Deploy to dev explicitly
firebase use dev && firebase deploy
```

### Local Development

This is a static site served by Firebase Hosting. To run locally:

```bash
firebase serve
```

Or use any static file server pointing to the `public/` directory.

### Firebase Projects

Three environments configured in `.firebaserc`:
- `default`: ecs-sistema-capacity (dev)
- `prd`: ecs-capacity-system (production)
- `dev`: ecs-sistema-capacity-dev (development)

## Important Patterns

### Modal System

Three modals for CRUD operations (profissional, projeto, alocacao):
- Opened via `openModal()` generic function or specific helpers (lines 364-417)
- Forms use `handleFormSubmit()` with data mapper pattern (lines 1243-1314)
- Validation happens in submit handler before Firestore operations

### Date Handling

- Firestore stores dates as strings in `YYYY-MM-DD` format
- `formatDate()` function converts to `DD/MM/YYYY` for display (lines 227-231)
- Timeline uses UTC dates to avoid timezone issues (lines 1644-1719)

### Filter System

Debounced input filters with 300ms delay for performance:
- Dashboard filters: name, team, leader, project, date range
- Uses `debounce()` utility (lines 21-27)
- Filters applied in render functions, not at data level

### Collapsible Sections

Dashboard sections use collapsible headers:
- Click handler on `#dashboard` element (lines 1469-1477)
- Toggles `.hidden` class on content
- Rotates arrow icon 180deg

## Key Files

- `public/index.html` - Single HTML file with all views and modals
- `public/app.js` - Main application logic (ES6 module, 1787 lines)
- `public/styles.css` - Custom styles including Toastify customization
- `firebase.json` - Firebase hosting config with SPA rewrite rule

## Common Modifications

### Adding a New View

1. Add view div with class `.view` in `index.html`
2. Add nav link with `data-view="viewname"` attribute
3. Update `viewConfig` object in `app.js` (lines 304-311)
4. Call `switchView('viewname')` to navigate

### Adding a New Collection

1. Add property to `appState` (lines 13-18)
2. Add collection handler to `setupRealtimeListeners()` (lines 246-271)
3. Create render function following existing pattern
4. Update `getCollectionPath()` is already generic

### Modifying Dashboard Calculations

Key functions for dashboard metrics:
- `updateDashboard()` - Main orchestrator (lines 537-686)
- `renderDashboardTable()` - Professional allocation view (lines 688-848)
- `renderDashboardProjectTable()` - Project view (lines 850-921)
- `renderDashboardPlannedVsRealizedTable()` - Timeline comparison (lines 923-976)
- `renderDashboardEffortTable()` - Hours tracking (lines 978-1027)

### Chart Configuration

- Profile distribution: Chart.js pie chart (lines 1480-1520)
- Monthly availability: Chart.js horizontal bar (lines 1522-1615)
- Timeline: Google Charts Timeline (lines 1617-1772)

## Notes

- No build process - pure static files with CDN dependencies
- Firebase config loaded dynamically via `/__/firebase/init.json` endpoint (line 84)
- All external dependencies loaded via CDN (Tailwind, Chart.js, Google Charts, Toastify)
- Working directory is `public/` subfolder
- Application state is ephemeral - all data persists in Firestore only
