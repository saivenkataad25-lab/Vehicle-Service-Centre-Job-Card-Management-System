# Vehicle Service Centre Job Card Management System
## UI Design Specification — Dark Workshop Theme

**Design direction:** Clean, practical, professional, and easy to read

**Primary appearance:** Dark theme

**Frontend:** Angular
**UI approach:** Reusable components, consistent spacing, restrained colour, and familiar admin-dashboard patterns

---

## 1. Design goals

The application should feel like a reliable workshop operations tool, not a marketing website or an AI product.

- Make job status, promised dates, vehicle details, and technician assignments easy to find.
- Keep the interface consistent across customers, vehicles, bookings, technicians, and job cards.
- Use a dark navy background with bright, readable text and clear borders.
- Use blue only for primary actions and links. Reserve green, amber, and red for meaningful statuses and feedback.
- Prefer tables, forms, labels, and simple cards over decorative graphics.
- Keep common actions visible and predictable: **Add**, **View**, **Edit**, **Save**, **Cancel**, and permitted **Delete**.
- Avoid gradients, glassmorphism, neon colours, oversized rounded cards, animated backgrounds, AI-style sparkle icons, and excessive motion.

## 2. Overall visual direction

### 2.1 Colour palette

Use these colours as the application's core design tokens. The contrast figures below are calculated for the stated foreground/background pairs; keep these pairings when applying the theme.

| Token | Hex value | Use |
|---|---|---|
| `--app-bg` | `#0B1220` | Main page background |
| `--sidebar-bg` | `#101A2B` | Sidebar and secondary navigation surfaces |
| `--surface` | `#162235` | Cards, tables, panels, and dialogs |
| `--surface-raised` | `#1B2B42` | Hovered rows, raised panels, and selected items |
| `--input-bg` | `#0F1B2C` | Input and select backgrounds |
| `--border` | `#2A3B52` | Dividers, input borders, and card outlines |
| `--text-primary` | `#F3F6FA` | Main text and headings |
| `--text-secondary` | `#B8C4D4` | Supporting text, labels, and table metadata |
| `--text-muted` | `#91A0B5` | Hints and low-priority metadata; do not use for important instructions |
| `--accent` | `#2563EB` | Primary buttons and selected controls |
| `--accent-hover` | `#1D4ED8` | Primary button hover state |
| `--link` | `#78B7FF` | Links and focused interactive text |
| `--success` | `#34D399` | Completed/success feedback |
| `--warning` | `#FBBF24` | On-hold, due-soon, and warning feedback |
| `--danger` | `#F87171` | Overdue/error/destructive feedback |

**Contrast checks:**

- Primary text `#F3F6FA` on the main background `#0B1220`: approximately **17.3:1**.
- Secondary text `#B8C4D4` on the main background: approximately **10.6:1**.
- Muted text `#91A0B5` on the main background: approximately **7.0:1**.
- Link text `#78B7FF` on the main background: approximately **8.9:1**.
- White text `#FFFFFF` on the primary blue button `#2563EB`: approximately **5.2:1**.

These pairings exceed the WCAG AA 4.5:1 target for normal text. Check contrast again if colours are changed or placed on a different surface.

### 2.2 Typography

Use **Inter** if it is already available to the project. Otherwise use a system sans-serif stack.

```css
font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
```

Recommended sizes:

| Element | Size | Weight |
|---|---:|---:|
| Page title | 24–28px | 600 |
| Section title | 18–20px | 600 |
| Card title | 15–16px | 600 |
| Body text | 14–15px | 400 |
| Table content | 13–14px | 400–500 |
| Form label | 13–14px | 500–600 |
| Helper text | 12–13px | 400 |

Use sentence case for labels and headings. Avoid all-caps text except for small, non-essential section identifiers.

### 2.3 Shape, spacing, and elevation

- Main content padding: **24px** on desktop, **16px** on smaller screens.
- Standard spacing scale: **4, 8, 12, 16, 24, 32px**.
- Card radius: **8px**.
- Input and button radius: **6px**.
- Main control height: **40–44px**.
- Card border: `1px solid var(--border)`.
- Prefer a subtle border over a strong shadow. Use shadows only for menus and dialogs that need separation.
- Keep icons simple and consistent: one outline icon style, around 18–20px. Icons should support a text label, not replace one for important actions.

---

## 3. Application layout

Use one consistent application shell across all pages.

### 3.1 Desktop layout

```text
┌──────────────────┬──────────────────────────────────────────────────────┐
│ WORKSHOP         │  Page title                 Search       User menu   │
│                  ├──────────────────────────────────────────────────────┤
│  Dashboard       │                                                      │
│  Customers       │  Breadcrumb                                           │
│  Vehicles        │                                                      │
│  Bookings        │  Main page content                                   │
│  Job Cards       │                                                      │
│  Technicians     │                                                      │
│  Reports         │                                                      │
│                  │                                                      │
│  Help / About    │                                                      │
└──────────────────┴──────────────────────────────────────────────────────┘
```

**Sidebar**

- Fixed width: approximately **230–250px**.
- Use `--sidebar-bg` with a thin right border.
- Show a simple workshop/tool icon and the application name at the top.
- Navigation items: Dashboard, Customers, Vehicles, Bookings, Job Cards, Technicians, Reports.
- Keep the active item highlighted with a muted blue background and a blue left indicator.
- Place Help/About at the bottom if required.
- Do not add navigation items for inventory, billing, insurance, or payment collection because they are outside the project scope.

**Top bar**

- Height: approximately **64px**.
- Show the current page title or breadcrumb, a global search field, and a small user/profile menu.
- Keep the top bar visually quiet; the page content should remain the focus.
- Do not add notification features unless they are implemented and useful.

**Main content**

- Use a maximum-width content area only where it improves readability; tables may use the full available width.
- Start each page with a title, one-line description, and primary action aligned to the right.
- Use consistent spacing between page header, filters, and content.

### 3.2 Responsive layout

- **Desktop (above 1024px):** expanded sidebar and full tables.
- **Tablet (768–1024px):** collapsible sidebar; allow tables to scroll horizontally if necessary.
- **Mobile (below 768px):** sidebar becomes a drawer; stack page actions and filters; use compact record cards or horizontally scrollable tables.
- Forms should become one column on mobile.
- Keep buttons and touch targets at least **44px** high where practical.
- Never hide important job status or promised-date information on smaller screens.

---

## 4. Shared UI components

Build these once and reuse them throughout the Angular application.

### 4.1 Buttons

| Type | Appearance | Use |
|---|---|---|
| Primary | Blue fill, white text | Main action such as Add Customer or Save Job Card |
| Secondary | Transparent/dark fill, bordered | Cancel, Back, or secondary action |
| Text | No filled background, blue text | View details or low-priority action |
| Danger | Red text or red-tinted fill | Delete or other destructive action |

Button rules:

- One primary action per page section where possible.
- Use a verb + object: **Create Booking**, **Save Changes**, **Assign Technician**.
- Disable Save while a request is being submitted and show a small loading indicator.
- Ask for confirmation before deleting a record.
- Do not use icon-only buttons for important actions unless an accessible tooltip and label are provided.

### 4.2 Status badges

Use compact pill-shaped badges with a tinted background, a readable text label, and optional small dot. Never communicate status by colour alone.

| Status | Suggested text colour | Meaning |
|---|---|---|
| Open | `#78B7FF` | Job card created and waiting to begin |
| In Progress | `#78B7FF` | Work is underway |
| On Hold | `#FBBF24` | Work is paused |
| Completed | `#34D399` | Service work is completed |
| Delivered | `#B8C4D4` | Vehicle has been delivered |
| Overdue | `#F87171` | Promised date has passed and job is not completed/delivered |
| Confirmed | `#34D399` | Booking is confirmed |
| Pending | `#FBBF24` | Booking requires action |
| Cancelled | `#91A0B5` | Booking has been cancelled |

Use a dark tinted background behind each status text. Keep enough contrast between badge text and badge background. The labels above are suggestions for visual mapping; the stored business status should remain the exact status defined by the backend.

### 4.3 Tables

All master-data and transaction list pages should use the same table component.

- Dark surface, clear header row, thin horizontal dividers.
- Row height around **48–56px**.
- Header text should be secondary text, medium weight.
- Highlight a row subtly on hover.
- Keep the actions column at the far right.
- Provide search, filters, sort indicators, and pagination where needed.
- Show a clear empty state when there are no records.
- Keep destructive actions inside a row menu or confirmation flow rather than placing a prominent red button in every row.

### 4.4 Forms and inputs

- Put labels above fields; do not rely on placeholders as labels.
- Use full-width inputs within a form grid.
- Use two columns on desktop for short related fields; use one column for long text and mobile layouts.
- Required fields should have a visible indicator.
- Show validation messages below the relevant field in red.
- Keep helper text short and directly below the field.
- Use date pickers for dates and dropdowns for controlled status/selection fields.
- Do not use colour alone to indicate invalid input; include text explaining the error.

### 4.5 Feedback states

Every API-backed page should support:

- Loading state: restrained spinner or skeleton rows.
- Empty state: short explanation and a relevant create action.
- Error state: readable message and Retry action where appropriate.
- Success feedback: small toast or inline confirmation after save/update/delete.
- Form validation state: field-level message and clear focus on the first invalid field.

### 4.6 Confirmation dialog

Use a consistent confirmation dialog for destructive actions.

Example:

> **Delete this customer?**
>
> This action cannot be undone. Vehicles or bookings linked to this customer may prevent deletion.
>
> **Cancel** · **Delete customer**

The backend must make the final decision. The frontend should display the backend's rejection message when related records or business rules prevent deletion.

---

## 5. Page-by-page UI specification

## 5.1 Dashboard

**Purpose:** Give workshop staff a quick operational overview.

Layout:

1. Page heading: **Workshop Dashboard** with a short line such as “Overview of bookings and workshop jobs”.
2. Four summary cards in one row on desktop:
   - Total active job cards
   - Open jobs
   - Jobs in progress
   - Overdue jobs
3. Main content in two columns:
   - **Current workshop jobs:** a compact table with Job Card No., Vehicle, Customer, Technician, Status, and Promised Date.
   - **Upcoming / overdue work:** a list grouped by due date, with overdue items clearly marked.
4. A small **Recent bookings** table or list below.
5. Quick actions: **New Booking** and **Register Customer**.

Dashboard rules:

- All counts and lists must come from backend APIs, not hardcoded sample values.
- Clicking a count or row should open the relevant filtered list or detail page.
- Highlight overdue work with a red label and text, not a large alarm graphic.
- Avoid unnecessary charts. A small status breakdown is optional only if it makes the current workload clearer.

## 5.2 Customers

**List page**

- Heading: **Customers** and button **Add Customer**.
- Search by customer name, phone, or customer code.
- Table columns: Customer Code, Full Name, Phone, Email, Number of Vehicles, Actions.
- Actions: View, Edit, Delete where allowed.

**Create / edit form**

- Customer Code
- Full Name
- Phone
- Email
- Address

**Customer details page**

- Customer contact summary at the top.
- Related vehicles listed below.
- Show relevant bookings through vehicle details or a related-record section if the API supports it.

## 5.3 Vehicles

**List page**

- Heading: **Vehicles** and button **Add Vehicle**.
- Search by registration number, make, model, or owner.
- Table columns: Registration No., Make / Model, Year, Fuel Type, Customer, Odometer, Actions.

**Create / edit form**

- Registration Number
- Make
- Model
- Year
- Fuel Type
- Customer (searchable select)
- Odometer Reading

**Vehicle details page**

- Vehicle information in a compact summary panel.
- Owner information with a link to the customer record.
- Booking history and associated job cards if the backend provides them.

**Important validation:** Registration number must be unique. Show a clear inline error if the backend rejects a duplicate.

## 5.4 Service Bookings

**List page**

- Heading: **Service Bookings** and button **New Booking**.
- Filters: Booking Status, Preferred Date, and Vehicle/Registration Number.
- Table columns: Booking No., Vehicle, Customer, Booking Date, Preferred Date, Status, Actions.

**Create booking form**

1. Select Customer or search for a registered vehicle.
2. Select Vehicle; show its registration number and model for confirmation.
3. Booking Date.
4. Preferred Service Date.
5. Customer Complaint (multiline text).
6. Booking Status (default to the backend's initial status).

**Booking details page**

- Show booking information and vehicle/customer summary.
- Provide **Create Job Card** only when a job card has not already been generated and the booking is eligible.
- Once a job card exists, show a direct link to it instead of offering a second creation action.

## 5.5 Technicians

**List page**

- Heading: **Technicians** and button **Add Technician**.
- Search by name, technician code, or skill area.
- Table columns: Technician Code, Full Name, Skill Area, Phone, Availability, Actions.

**Create / edit form**

- Technician Code
- Full Name
- Skill Area
- Phone
- Availability Status

**Technician details page**

- Contact and skill information.
- Current or recent assigned job cards, if supported by the API.

When allocating a technician to a job card, show availability clearly. The backend remains responsible for validating the assignment.

## 5.6 Job Cards

This is the most important workflow page. Give it more space and make the current status obvious.

**List page**

- Heading: **Job Cards** and relevant filters.
- Filters: Job Status, Technician, Promised Date, and overdue only.
- Table columns: Job Card No., Vehicle, Customer, Technician, Opened Date, Promised Date, Labour Estimate, Status, Actions.
- Use a clear overdue marker when the promised date has passed and the job is not Completed or Delivered.

**Job card details page**

Use a two-column desktop layout:

- **Main column:** vehicle/customer summary, service task entries, completion notes, and activity/status information.
- **Side column:** job card number, status, assigned technician, opened date, promised date, and labour estimate.

Suggested sections:

1. **Job summary** — Job Card No., related Booking No., customer, vehicle registration, make/model, odometer if available.
2. **Assignment** — technician selector and current assignment.
3. **Service tasks** — repeatable rows for task description, estimated labour, and completion state/notes as appropriate to the agreed data model.
4. **Estimate** — total labour estimate calculated from task entries, with the saved estimate shown clearly.
5. **Status** — current status badge and only the next valid status actions.
6. **Completion notes** — notes entered when the work is marked completed.

**Status workflow**

Use controlled status actions rather than allowing users to freely choose any status. A simple proposed flow is:

```text
Open → In Progress → Completed → Delivered
                 ↘ On Hold → In Progress
```

The backend must enforce the permitted transitions. If the project team or supervisor defines a different transition rule, update both the backend and UI consistently.

**Deletion rule:** Completed and Delivered job cards must not have a Delete action. The interface should explain the restriction rather than showing a button that will always fail.

**Scope reminder:** The job card screen can record service tasks and labour estimates. Do not add spare-parts inventory, payment collection, invoicing gateway, or insurance claim features.

## 5.7 Reports

Keep this page simple and limited to information available from the project's APIs.

Suggested reports:

- Job cards grouped by status.
- Completed jobs for a selected date range.
- Overdue jobs.
- Technician workload / assigned job cards, if supported by backend data.

Provide date filters and a clear table. Export functionality is optional and should only be added after core workflows work correctly.

---

## 6. Key user journeys

### Journey A — Register a customer and vehicle

1. Open Customers → Add Customer.
2. Enter customer details and save.
3. Open Vehicles → Add Vehicle.
4. Select the customer and enter vehicle details.
5. Save and confirm the vehicle appears in the vehicle list and customer details page.

### Journey B — Create a booking

1. Open Service Bookings → New Booking.
2. Select the vehicle and verify its owner.
3. Enter booking and preferred dates plus the complaint.
4. Save and open the booking details.

### Journey C — Convert a booking into a job card

1. Open an eligible booking.
2. Select **Create Job Card**.
3. Enter opened/promised dates and assign a technician.
4. Add service task entries and labour estimates.
5. Save and confirm the booking now links to its job card.

### Journey D — Complete and deliver a job

1. Open the job card.
2. Move it through valid status actions.
3. Add completion notes and update the estimate when needed.
4. Mark it Completed after work is recorded.
5. Mark it Delivered when the vehicle is handed over.
6. Verify it appears in the completed/delivered report as required.

---

## 7. Navigation and route suggestions

Use Angular Router with a predictable route structure. Adjust names to match the project's actual component naming, but keep the route pattern consistent.

```text
/dashboard
/customers
/customers/new
/customers/:id
/customers/:id/edit
/vehicles
/vehicles/new
/vehicles/:id
/vehicles/:id/edit
/bookings
/bookings/new
/bookings/:id
/technicians
/technicians/new
/technicians/:id
/technicians/:id/edit
/job-cards
/job-cards/:id
/reports
```

Use a breadcrumb on detail and edit pages, for example:

`Job Cards / JC-00024`

After a successful create operation, navigate to the new record's detail page or show the new record in the list. After editing, show a success message and the updated saved value.

---

## 8. Suggested Angular component structure

A possible structure for reusable UI pieces:

```text
src/app/
├── core/
│   ├── layout/
│   │   ├── app-shell/
│   │   ├── sidebar/
│   │   └── topbar/
│   ├── services/
│   └── interceptors/
├── shared/
│   ├── components/
│   │   ├── page-header/
│   │   ├── data-table/
│   │   ├── status-badge/
│   │   ├── confirm-dialog/
│   │   ├── loading-state/
│   │   ├── empty-state/
│   │   └── error-message/
│   └── pipes/
├── features/
│   ├── dashboard/
│   ├── customers/
│   ├── vehicles/
│   ├── bookings/
│   ├── technicians/
│   ├── job-cards/
│   └── reports/
└── app.routes.ts
```

Each feature should contain its own pages, forms, models, and feature-specific services where appropriate. Keep HTTP calls in Angular services rather than placing them directly inside components.

### Reusable component responsibilities

| Component | Responsibility |
|---|---|
| `AppShellComponent` | Sidebar, top bar, and routed page container |
| `PageHeaderComponent` | Page title, description, and primary action slot |
| `DataTableComponent` | Consistent table, sorting, paging, and empty state |
| `StatusBadgeComponent` | Consistent text and colour for statuses |
| `ConfirmDialogComponent` | Confirm destructive actions |
| `LoadingStateComponent` | Loading feedback for API requests |
| `EmptyStateComponent` | Explain when a list has no data and offer a relevant action |
| `ErrorMessageComponent` | Display API and validation errors clearly |

---

## 9. CSS design tokens

Add a central theme file such as `src/styles/_theme.scss` or define these values in the global stylesheet.

```css
:root {
  color-scheme: dark;

  --app-bg: #0B1220;
  --sidebar-bg: #101A2B;
  --surface: #162235;
  --surface-raised: #1B2B42;
  --input-bg: #0F1B2C;
  --border: #2A3B52;

  --text-primary: #F3F6FA;
  --text-secondary: #B8C4D4;
  --text-muted: #91A0B5;

  --accent: #2563EB;
  --accent-hover: #1D4ED8;
  --link: #78B7FF;

  --success: #34D399;
  --warning: #FBBF24;
  --danger: #F87171;

  --radius-card: 8px;
  --radius-control: 6px;
  --content-padding: 24px;
}

html,
body {
  min-height: 100%;
  margin: 0;
  background: var(--app-bg);
  color: var(--text-primary);
  font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
}

body {
  font-size: 14px;
  line-height: 1.5;
}

.card,
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
}

input,
select,
textarea {
  background: var(--input-bg);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
}

input::placeholder,
textarea::placeholder {
  color: var(--text-muted);
  opacity: 1;
}

input:focus-visible,
select:focus-visible,
textarea:focus-visible,
button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--link);
  outline-offset: 2px;
}

button.primary {
  background: var(--accent);
  color: #FFFFFF;
  border: 1px solid var(--accent);
}

button.primary:hover {
  background: var(--accent-hover);
}

button.secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border);
}
```

This is a starting point, not a complete stylesheet. Apply the tokens to Angular Material or Bootstrap components consistently if either library is used. Avoid mixing default light-theme components into the dark application.

---

## 10. Interaction and usability rules

- Keep the same position and wording for common actions across all modules.
- Confirm before destructive operations.
- Do not allow the user to submit a form repeatedly while a request is pending.
- Preserve entered values if a recoverable API error occurs.
- Show backend validation errors beside the relevant field where possible.
- Use clear date formats consistently, for example `26 Nov 2026` in the UI. Send API dates in the format expected by the backend.
- For money/estimates, use one consistent currency format across the application. Confirm the required currency with the project team before implementation.
- Show a clear no-results message when filters return no matches; provide a way to clear filters.
- Use pagination for large lists rather than loading every record at once.
- Do not show actions that the current record is not allowed to perform.

## 11. Accessibility checklist

- Maintain the specified text/background contrast pairings.
- Use visible keyboard focus styles.
- Use semantic headings in order (`h1`, then `h2`, etc.).
- Every input must have a programmatic label.
- Every icon-only control needs an accessible name.
- Status must include readable text, not just a colour or icon.
- Do not rely only on red/green to communicate errors or success.
- Make dialogs keyboard accessible and return focus to the initiating control when closed.
- Respect reduced-motion preferences; this design should not need decorative animations.

## 12. Screenshots to capture for project submission

Use the same dark theme in all evidence screenshots. Capture real records from the running application.

1. **Project setup:** Angular app shell, feature folders, and Spring Boot project running.
2. **Dashboard:** summary cards, current jobs, and overdue/promised-date information.
3. **Create:** valid customer or vehicle form and the saved record.
4. **Read:** searchable master list and one details page.
5. **Update:** edit a record and show the persisted updated value.
6. **Delete/status:** permitted deletion or a valid job status change; also show the completed/delivered deletion restriction if useful.
7. **API:** Postman GET, POST, PUT, and DELETE/status response examples.
8. **Database:** MySQL tables, sample rows, and foreign-key relationships.

---

## 13. Build order for the UI

Implement the visual foundation first, then build screens in this order:

1. **Theme and app shell:** colour tokens, typography, sidebar, top bar, page container, responsive layout.
2. **Shared components:** buttons, page header, forms, tables, status badges, dialogs, loading/empty/error states.
3. **Master screens:** Customers, Vehicles, Technicians.
4. **Booking screens:** list, create/edit form, details, and create-job-card action.
5. **Job card screens:** list, details, technician allocation, task entries, estimate, and status actions.
6. **Dashboard and reports:** connect real API summaries and report filters.
7. **Responsive and accessibility pass:** test tablet/mobile sizes, keyboard navigation, focus, labels, and contrast.
8. **Evidence pass:** capture the required screenshots using the final theme.

Do not spend time polishing charts or animations before the complete booking-to-job-completion workflow works.

---

## 14. Final design decision summary

The recommended interface is a **dark navy workshop admin dashboard** with:

- Deep navy page and sidebar backgrounds.
- Slightly lighter solid panels with thin borders.
- Near-white primary text and high-contrast secondary text.
- Restrained blue primary actions.
- Green, amber, and red reserved for status and feedback.
- Compact tables, practical forms, simple status badges, and clear page headings.
- A consistent sidebar/topbar shell and reusable Angular components.

This direction is intentionally straightforward. It should be achievable with Angular and a standard component library while still looking polished, readable, and suitable for a vehicle service centre.
