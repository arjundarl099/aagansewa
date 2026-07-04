# TODO - Booking module redesign & fix

## Step 1 — Confirm current understanding (analysis)
- [x] Map current booking routes/controllers/models
- [x] Identify gaps vs required workflow (provider accept/cancel, duplicate prevention, cancelledBy, provider dashboard endpoints)
- [x] Identify schema mismatch (Bookers.service String vs Services ObjectId usage)

## Step 2 — Plan schema changes (approved)
- [ ] Update `backend/Models/Bookers.js`:
  - [ ] change `service` from `String` → `ObjectId` ref `Services`
  - [ ] add `cancelledBy` field (`user|provider`)
  - [ ] add unique index to prevent duplicate bookings for same provider/date/time


## Step 3 — Plan controller changes
- [ ] Update `backend/Controllers/booker.js`:
  - [ ] validate inputs + enforce duplicate prevention
  - [ ] keep existing user endpoints working
  - [ ] add provider-only listing endpoint (pending/confirmed/cancelled)
  - [ ] add provider confirm endpoint (pending → confirmed)
  - [ ] add provider cancel endpoint (pending/confirmed → cancelled; sets cancelledBy=provider; restores capacity)
  - [ ] update user cancel endpoint (sets cancelledBy=user; restores capacity)
  - [ ] ensure capacity updates are correct for each transition

## Step 4 — Plan route changes
- [ ] Update `backend/route/booker.js`:
  - [ ] add new provider routes with proper authorization
  - [ ] keep existing routes untouched

## Step 5 — Frontend changes
- [ ] Update `frontend/js/dashboard.js` to:
  - [ ] show cancelled buckets based on `cancelledBy`
  - [ ] keep existing cancel button for user cancellations
- [ ] Update `frontend/js/provider.js` and `frontend/provider.html` to:
  - [ ] show pending requests / confirmed / cancelled buckets
  - [ ] add accept/confirm and provider-cancel actions

## Step 6 — Email notifications
- [ ] Inspect `backend/Controllers/notifyController.js` + notify utilities
- [ ] Implement/align missing email sending using existing architecture
- [ ] Hook emails into:
  - [ ] booking created → email provider
  - [ ] provider confirms → email user
  - [ ] provider cancels → email user
  - [ ] user cancels → email provider

## Step 7 — DB migration / verification
- [ ] Apply schema change + ensure existing dev DB is migrated/cleared if needed
- [ ] Verify indexes are created

## Step 8 — Testing
- [ ] Run backend dev server
- [ ] Manual test flows:
  - [ ] create booking
  - [ ] duplicate prevention
  - [ ] provider pending list
  - [ ] provider confirm → dashboards update
  - [ ] user cancel + provider cancel → dashboards update + capacity restore
  - [ ] emails are sent

