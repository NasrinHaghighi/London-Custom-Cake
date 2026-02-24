# Order Flow Smoke Test (5 Minutes)

Use this quick checklist after any change to orders/customer flow.

## 1) Customer Step
- [ ] Existing customer phone lookup autofills correctly
- [ ] Changing phone clears previous customer data
- [ ] Can proceed with Delivery + existing address

## 2) Order Step
- [ ] Product + flavor dropdowns load and filter correctly
- [ ] Product with shapes requires shape
- [ ] Product without shapes can add item without shape
- [ ] Date + time selection works (`09:00` to `20:00` only)

## 3) Pricing & Rules
- [ ] Item draft total updates when qty/weight changes
- [ ] Subtotal and total update after adding/removing items
- [ ] Loyalty discount displays correctly (10% for returning customer)
- [ ] Admin note shows 50% minimum to confirm

## 4) Create Order
- [ ] Create Order succeeds with valid data
- [ ] App auto-navigates to Payment tab on success
- [ ] New order appears in previous orders list/history

## 5) API Spot Check (optional)
Run:

```powershell
pwsh -File .\scripts\test-orders-api.ps1 -AdminPhone "<phone>" -AdminPassword "<password>" -CustomerPhone "<customer_phone>"
```

- [ ] Pickup + delivery order creation pass
- [ ] History endpoint returns created orders
