# Order Flow Test Checklist

Use this checklist to validate end-to-end order creation behavior in the admin dashboard.

## Preconditions

- [ ] App starts successfully with `npm run dev`
- [ ] `.env.local` is configured (`MONGODB_URI`, `JWT_SECRET`)
- [ ] Admin account can log in
- [ ] Test data exists:
  - [ ] At least one product type with configured shapes
  - [ ] At least one product type without configured shapes
  - [ ] Flavors and product-flavor combinations configured
  - [ ] At least one existing customer with address(es)

---

## A. Customer Tab (Step 1)

### A1. Existing Customer Lookup
- [ ] Enter existing customer phone
- [ ] Customer autofill appears (first name, last name, email)
- [ ] Existing addresses are shown when available

### A2. New Customer Flow
- [ ] Enter non-existing phone
- [ ] Previous customer data clears immediately when phone changes
- [ ] Enter new customer details and continue
- [ ] Tab 2 shows customer summary (customerId correctly set)

### A3. Address Modes
- [ ] Existing Address mode works for customer with addresses
- [ ] New Address mode allows adding a new address and proceeding
- [ ] After saving new address, it becomes selectable and used

### A4. Delivery vs Pickup
- [ ] Delivery selected: address required
- [ ] Pickup selected: address is not required

---

## B. Order Tab (Step 2)

### B1. Customer Summary Section
- [ ] Order contact summary renders for both existing and newly created customer
- [ ] Section can collapse/expand
- [ ] Pickup toggle updates fulfillment mode

### B2. Previous Orders
- [ ] Previous orders list loads for existing customer
- [ ] Empty state shows for customer with no orders

### B3. Product / Flavor / Shape Rules
- [ ] Product selection loads related flavor options only
- [ ] Invalid product-flavor combinations do not appear as selectable
- [ ] Product with configured shapes requires shape selection
- [ ] Product without configured shapes allows add item without shape

### B4. Time Selection
- [ ] Date input works
- [ ] Time options only allow `09:00` through `20:00`
- [ ] No minute-level input is available

### B5. Price Calculation (UI Preview)
- [ ] Per-unit product updates draft total using quantity
- [ ] Per-kg product updates draft total using weight
- [ ] Flavor extra price is included correctly
- [ ] Subtotal reflects sum of added items

### B6. Discounts and Confirmation Notice
- [ ] Loyalty discount shows 10% for returning customer
- [ ] Loyalty discount shows 0 for first-time customer
- [ ] Total is displayed after discount
- [ ] Admin note shows 50% minimum amount needed to confirm

### B7. Order Submission
- [ ] Create Order succeeds with valid inputs
- [ ] On success, app moves automatically to Payment tab
- [ ] Previous orders query invalidates/refreshes

---

## C. Payment Tab (Step 3)

- [ ] Payment tab becomes accessible only after successful order creation
- [ ] Navigation to Payment tab works from order creation success

---

## D. Backend Validation Checks

### D1. Core API checks
- [ ] `POST /api/orders` returns `201` on valid payload
- [ ] `GET /api/orders?customerId=...` returns newly created order

### D2. Expected validation errors (`400`)
- [ ] Missing delivery address when delivery mode
- [ ] Shape missing for product types that require shape
- [ ] Invalid flavor for selected product
- [ ] Quantity/weight outside product min/max constraints

### D3. Shape optional case
- [ ] Product type without configured shapes allows order creation
- [ ] No `cakeShapeId` required error appears in this case

---

## E. Script Regression Test

Run:

```powershell
pwsh -File .\scripts\test-orders-api.ps1 -AdminPhone "<phone>" -AdminPassword "<password>" -CustomerPhone "<customer_phone>"
```

- [ ] Login success
- [ ] Pickup order created
- [ ] Delivery order created (or explicitly skipped if no address)
- [ ] Order history returns created orders

---

## Notes / Defects Found

- Date:
- Scenario:
- Expected:
- Actual:
- Screenshot / Logs:
