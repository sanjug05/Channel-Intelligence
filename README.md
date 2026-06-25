# Channel Intelligence — v1.0

Internal analytics dashboard for all-India channel partner monitoring.

## Quick Start

1. Open `index.html` directly in a modern browser — no server required for demo mode
2. Login: `admin / admin123` (full access) or `demo / demo123` (view-only)
3. Demo data loads automatically: 16 partners, 4 zones, 288 rows of 2025–2026 sales data

## File Tree

```
channel-dashboard/
├── index.html      — App shell, all page layouts, partner modal, CDN script tags
├── styles.css      — Full CSS: light/dark theme, responsive layout, all components
├── app.js          — State, calculations, rendering, charts, filters, Excel, integrations
├── sampleData.js   — 16 synthetic partners + generated 2025–2026 sales data
└── README.md
```

## Data Sources

| Source       | Status       | How to activate                              |
|--------------|--------------|----------------------------------------------|
| Demo         | ✅ Active     | Default — no setup needed                    |
| Excel Upload | ✅ Ready      | Upload from Excel Tools page or Data Sources |
| Google Sheets| 🔧 Hook ready | See config below                             |
| Firebase     | 🔧 Hook ready | See config below                             |

## Google Sheets Setup

1. Publish your sheet: File → Share → Publish to web → Entire document → CSV
2. Create a Google Cloud project and enable the Sheets API
3. Generate an API key restricted to Sheets API
4. In `app.js`, update `APP.SHEETS`:
   ```js
   SHEETS: { apiKey: 'AIza...', sheetId: '1BxiM...abc' }
   ```
5. Your sheet must have two tabs: `Partner_Details` and `Sales_Data` with headers matching the schema

## Firebase Setup

1. Create a Firebase project at console.firebase.google.com
2. Enable Authentication (Email/Password) and Firestore Database
3. In `app.js`, fill `APP.FIREBASE`:
   ```js
   FIREBASE: { apiKey:'AIza...', authDomain:'project.firebaseapp.com', projectId:'project-id' }
   ```
4. Add Firebase SDK CDN links to `index.html` head (see commented block in `connectFirebase()`)
5. Create Firestore collections matching this schema:
   - `/partners/{partnerCode}` — partner documents
   - `/sales_data/{id}` — monthly sales records
   - `/users/{uid}` — user role documents (`role: 'admin' | 'viewer'`)
6. Uncomment the implementation block inside `connectFirebase()` in `app.js`

## Excel Schema

Download the sample workbook from Excel Tools page. Required sheets:

**Sheet 1: Partner_Details**
`Serial Number | Partner Code | ASM | RM | Territory | Zone | City | State | Tier | Channel Partner Firm Name | Channel Partner Name | Verification Status | Verification Notes`

**Sheet 2: Sales_Data**
`Serial Number | Partner Code | Year | Month | Sales | OBK | UEOB | AIS Leads Provided | Leads Worked | Leads Generated | Leads Added To CRM`

Sales values should be in ₹ (rupees, full integer). All column headers must match exactly.

---

## Phase 2 Plan

1. **KPI engine with date-range toggle** — compare any custom period, not just fixed CY/LY windows; add quarter and rolling-12-month views
2. **Sortable partner table view** — toggle between card grid and data table with sortable columns, pagination, and CSV export
3. **Filter URL persistence** — encode active filters as query params so filtered views are bookmarkable and shareable
4. **Territory drill-down** — click a zone/territory to sub-aggregate KPIs and show only relevant partners inline
5. **Google Sheets fetch with mapping wizard** — column-mapping UI to handle variations in sheet structure; refresh button with last-synced timestamp
6. **Firebase real-time sync + auth role enforcement** — live onSnapshot listeners, role-gated write actions (verify/reject partner), audit trail in Firestore
7. **Export utilities** — one-click: filtered partner list → CSV, KPI snapshot → PDF, monthly trend → PNG
8. **Verification workflow** — approve/reject/request-more-info actions with notes, status history timeline per partner, email notification hooks
9. **Partner performance league table** — ranked view with percentile bands, month-over-month rank change indicator, zone-relative comparison
10. **Mobile gesture support** — swipe-open sidebar, pull-to-refresh on data sources, bottom-sheet partner detail on small screens
