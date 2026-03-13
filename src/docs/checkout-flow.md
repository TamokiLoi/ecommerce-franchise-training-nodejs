# Checkout Flow

This document describes the flow from **Cart → Order → Payment → Delivery**.

The checkout process converts a temporary cart into a finalized order.

---

# 1. Overview

Checkout flow:

Cart
↓
Apply Promotion
↓
Apply Voucher
↓
Apply Loyalty Points
↓
Recalculate Cart
↓
Create Order
↓
Create Order Items
↓
Create Payment
↓
Process Delivery (if ONLINE order)

---

# 2. Step-by-Step Flow

## Step 1 — Validate Cart

Before checkout, the system validates the cart.

Validation rules:

* Cart must exist
* Cart status must be ACTIVE
* Cart must contain items
* Products must still exist and be active
* Cart must belong to the correct franchise

---

## Step 2 — Recalculate Cart

System recalculates the cart to ensure correct pricing.

Calculation order:

1. Subtotal
2. Promotion discount
3. Voucher discount
4. Loyalty points discount
5. Final amount

Formula:

```
final_amount =
subtotal_amount
- promotion_discount
- voucher_discount
- loyalty_discount
```

---

## Step 3 — Validate Voucher

Voucher validation:

* Voucher exists
* Voucher is active
* Current date is within start_date and end_date
* quota_used < quota_total
* Cart subtotal satisfies minimum conditions

---

## Step 4 — Validate Loyalty Points

Rules:

* Customer must have enough points
* Points must not exceed max redeem rule
* Points must meet minimum redeem rule

---

## Step 5 — Create Order

Cart is converted into an order.

Order fields snapshot:

* customer_id
* franchise_id
* subtotal_amount
* promotion_discount
* voucher_discount
* loyalty_discount
* final_amount
* voucher_code_snapshot
* loyalty_points_used

Order status:

```
CONFIRMED
```

---

## Step 6 — Create OrderItems

Each cart item becomes an order item.

Fields snapshot:

* product_franchise_id
* product_name_snapshot
* price_snapshot
* quantity
* line_total
* final_line_total
* options snapshot

---

## Step 7 — Create Payment

A payment record is created.

Payment status depends on method:

CASH

```
status = SUCCESS
```

Online payment (MOMO / VNPAY)

```
status = PENDING
```

Payment fields:

* order_id
* method
* amount
* status
* provider_txn_id

---

## Step 8 — Update Loyalty

When order is completed:

```
points = floor(order.final_amount / earn_amount_per_point)
```

System actions:

* Update CustomerFranchise.loyalty_points
* Create LoyaltyTransaction (type = EARN)

---

## Step 9 — Create Delivery (Online Orders Only)

If order type = ONLINE:

Delivery record is created.

Delivery status:

```
ASSIGNED
```

Delivery flow continues in Delivery module.

---

# 3. Checkout Flow Diagram

```
Cart
 │
 ▼
Recalculate Cart
 │
 ▼
Validate Voucher / Loyalty
 │
 ▼
Create Order
 │
 ▼
Create OrderItems
 │
 ▼
Create Payment
 │
 ▼
Delivery (if ONLINE)
```

---

# 4. Important Notes

Cart must be recalculated before checkout.

Order stores **snapshot data** to prevent price changes from affecting history.

Payment and Refund are separate modules.

Loyalty points are granted **after order completion**, not during checkout.
