# 🧪 SUBSCRIPTION SYSTEM - COMPLETE TEST GUIDE

## PRE-TEST CHECKLIST ✅

- [ ] Both apps have been installed: `npm install` completed
- [ ] Firebase is initialized and working (depots/categories visible)
- [ ] You have admin access to depot-dashboard
- [ ] You have vendor access to maman-power-app

---

## TEST SCENARIO 1: NEW SIGNUP WITH AUTO SUBSCRIPTION

### Manager Signs Up (depot-dashboard)

1. Open `http://localhost:5173` (depot-dashboard)
2. Click "Créer un compte Manager"
3. Fill form:
   - **Nom Complet:** "Test Manager"
   - **Téléphone:** "+242 06 123 4567" (or any phone)
   - **WhatsApp:** "+242 06 987 6543"
   - **Quartier:** "Bakongo"
   - **Adresse:** "Rue de la Paix, Bakongo"
   - **Dépôt:** "Dépôt Test"
   - **Mot de passe:** "password123"
4. Click "S'inscrire"

### Expected Result ✅

- Alert: "✅ Compte manager créé avec succès et dépôt créé automatiquement!"
- Auto-login to dashboard
- Depot visible in dropdown
- **NO** subscription alert (daysRemaining > 7)

### What Happened Behind the Scenes

```
registerUser() ADDED to Firebase:
  - manager user profile
  - depot with:
    - subscription_expiry = NOW + 30 days
    - subscription_status = "active"
```

---

## TEST SCENARIO 2: VIEW SUBSCRIPTION STATUS

### Manager Views Depot Details

1. Login to depot-dashboard (if not already)
2. Select depot from dropdown
3. Scroll down to DepotCard

### Expected Results Based on Time

| Days Remaining   | Status     | UI                                |
| ---------------- | ---------- | --------------------------------- |
| > 7 days         | ✅ Active  | No alert                          |
| 7-1 days         | ⚠️ Warning | **Orange alert** + "Payer" button |
| 0 days (expired) | ❌ Expired | **Red alert** + "Payer" button    |

### Test Expired Status

To manually test, you can:

1. Open browser DevTools (F12)
2. Go to Console
3. Run:

```javascript
localStorage.setItem("test-expired", new Date(Date.now() - 1000).toISOString());
```

This simulates an expired date for testing purposes.

---

## TEST SCENARIO 3: RENEW SUBSCRIPTION (PAYER BUTTON)

### Manager Clicks "Payer"

1. If subscription is active (no alert): **Skip to next test**
2. If subscription has alert:
   - Click "💳 Payer (+30 jours)" button
   - Button changes to "⏳ Renouvellement..."
   - Wait for response

### Expected Result ✅

- Alert: "✅ Abonnement renouvelé pour 30 jours!"
- UI refreshes
- Subscription alert disappears (new expiry > 7 days)
- In Firebase: `subscription_expiry` = now + 30 days

### Verification in Firebase (Optional)

1. Go to Firebase Console: https://console.firebase.google.com
2. Select "vision-unique" project
3. Go to "Realtime Database"
4. Navigate to: `depots/<depot-id>`
5. Check `subscription_expiry` = future date

---

## TEST SCENARIO 4: VENDORS ONLY SEE ACTIVE DEPOTS

### Setup: Create Multiple Depots

1. Create 2 managers with different depots (Scenario 1 twice)
2. One depot: Leave with active subscription
3. Second depot: Manually expire by clicking "Payer" to get it expired (use future date manipulation in console)

### Vendor Views Available Depots

1. Open `http://localhost:5174` (maman-power-app)
2. Vendor logs in
3. Scroll list of depots

### Expected Result ✅

**Active Depots:** ✅ Visible in list
**Expired Depots:** ❌ Hidden from list

### Why This Works

```
maman-power-app/src/firebase.js filters with:
  is_active === true AND subscription_status === "active"
```

Result: Expired depots automatically hidden from vendors

---

## TEST SCENARIO 5: PAGINATION WITH FILTERED DEPOTS

### Load Many Depots

1. In depot-dashboard: Create 25+ depots with Managers
2. In maman-power-app: Vendor opens the app
3. Verify pagination works

### Expected Result ✅

- First page: 20 depots (only active subscriptions)
- Button: "⬇️ Charger plus (20/X)"
- Expired depots NOT counted in total

---

## TEST SCENARIO 6: MIGRATION OF EXISTING DEPOTS

### Why This Test?

Your existing depots created BEFORE this update might not have `subscription_expiry` field.
Migration adds it retroactively.

### Run Migration (Option A: Admin Panel)

1. Login to depot-dashboard as admin
2. (TODO: Admin button to trigger migration - not yet implemented)

### Run Migration (Option B: Console - For Testing)

1. Open depot-dashboard
2. Press F12 to open DevTools Console
3. Run:

```javascript
import { migrateExistingDepots } from "./src/firebase.js";
const result = await migrateExistingDepots();
console.log(result);
```

### Expected Output ✅

```javascript
{
  success: true,
  migratedCount: 5  // Number of depots migrated
}
```

### Verification

After migration, all depots should have:

- `subscription_status: "active"`
- `subscription_expiry: <created_at + 30 days>`

---

## TEST SCENARIO 7: DARK MODE ALERT STYLING

### Verify Dark Mode CSS

1. In depot-dashboard: Click dark mode toggle (top-right)
2. Select a depot with subscription alert
3. Verify alert still visible and readable

### Expected Result ✅

- Alert background: Dark orange/brown
- Text: Light orange for readability
- Button: Still visible and clickable
- No styling broken

---

## PERFORMANCE CHECKS 🚀

### Verify No Firebase Quota Hit

#### Before This Update:

- Every 60 seconds: Poll read (2880 reads/day)
- FREE tier: 100 reads/day
- **PROBLEM**: Quota exceeded in ~2 hours ❌

#### After This Update:

- calculateDaysRemaining(): Pure JavaScript
- updateSubscription(): Single write (on "Payer" click only)
- listenToDepotsAndProducts(): Realtime listener (already existing)
- **RESULT**: 0 new Firebase quota used ✅

### Verify Filtering Speed

- Realtime listener should return results instantly
- No delay when switching between depots

---

## TROUBLESHOOTING 🔧

### "Payer Button Not Showing"

**Issue:** Subscription alert not visible

- [ ] Check Firebase has `subscription_expiry` field
- [ ] Verify date is < 7 days from now
- [ ] Check browser console for errors

### "Expired Depots Still Showing in Vendor App"

**Issue:** Subscription filter not working

- [ ] Refresh maman-power-app page
- [ ] Verify `subscription_status === "active"` in Firebase
- [ ] Check browser console for errors

### "Error When Clicking Payer"

**Issue:** Renewal failed

- [ ] Check Firebase connection
- [ ] Verify depot has write permissions
- [ ] Check browser console for error message

### "Migration Shows migratedCount: 0"

**Issue:** No depots migrated (expected if already migrated)

- [ ] This is OK if all depots already have `subscription_expiry`
- [ ] Safe to run multiple times

---

## SUCCESS CHECKLIST ✅

- [ ] New manager can sign up with auto-subscription
- [ ] Manager sees "Payer" button when < 7 days remain
- [ ] Manager can click "Payer" and renew subscription
- [ ] Vendor app shows only active depots
- [ ] Expired depots hidden from vendor
- [ ] Dark mode styling works correctly
- [ ] No Firebase quota consumed (non-polling)
- [ ] Migration completed without errors

---

## NEXT STEPS AFTER TESTING

### If All Tests Pass ✅

1. Deploy to production
2. Run migration on production depots
3. Monitor Firebase quota (should be significantly lower)

### If Issues Found ❌

1. Report issue with:
   - Browser console error
   - Firebase data (screenshot)
   - Steps to reproduce

---

## MANUAL TEST COMMANDS

### Check Subscription Status in Console

```javascript
// In depot-dashboard or maman-power-app
import { calculateDaysRemaining } from "./src/firebase.js";
const expiryDate = "2025-01-30T10:30:45.000Z"; // Your subscription_expiry
const days = calculateDaysRemaining(expiryDate);
console.log(`Days remaining: ${days}`);
```

### View All Depots in Firebase

```javascript
import { db } from "./src/firebase.js";
import { ref, get } from "firebase/database";

const depotsRef = ref(db, "depots");
const snapshot = await get(depotsRef);
console.table(snapshot.val());
```

---

## TIMING NOTES ⏰

- Subscriptions last: **30 days**
- Warning alert shows when: **< 7 days remain**
- Calculations happen: **Client-side only** (0ms Firebase overhead)
- Status updates: **Instant** when clicking "Payer"

---

**✅ Test Complete! Report any issues above.** 🚀
