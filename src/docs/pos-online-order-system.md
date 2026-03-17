# POS + Online Order System Architecture

## Core Modules

Cart
Order
Payment
Delivery
Refund
Promotion
Voucher
Loyalty

---

# 1. Cart

Cart represents a temporary shopping session.

### Cart Fields

* customer_id
* franchise_id
* staff_id
* status (ACTIVE / CHECKED_OUT / CANCELED)

### Pricing

* subtotal_amount
* promotion_discount
* voucher_discount
* loyalty_discount
* final_amount

### Promotion Snapshot

* promotion_id
* promotion_type
* promotion_value

### Voucher Snapshot

* voucher_id
* voucher_code
* voucher_type
* voucher_value

### Loyalty

* loyalty_points_used

---

# 2. CartItem

Represents products inside cart.

Fields:

* cart_id
* product_franchise_id
* quantity
* product_cart_price
* line_total
* final_line_total
* note

Options (addons / toppings):

* product_franchise_id
* quantity
* price_snapshot
* final_price

---

# 3. Order

Order is the finalized snapshot created from cart.

Fields:

* code
* franchise_id
* customer_id
* type (POS / ONLINE)

Status:

* DRAFT
* CONFIRMED
* PREPARING
* READY_FOR_PICKUP
* OUT_FOR_DELIVERY
* COMPLETED
* CANCELED

Pricing snapshot:

* subtotal_amount
* promotion_discount
* voucher_discount
* loyalty_discount
* final_amount

Voucher snapshot:

* voucher_code_snapshot

Loyalty snapshot:

* loyalty_points_used

Lifecycle timestamps:

* confirmed_at
* completed_at
* cancelled_at

---

# 4. OrderItem

Snapshot of cart item at order time.

Fields:

* order_id
* product_franchise_id
* product_name_snapshot
* price_snapshot
* quantity
* promotion_discount
* line_total
* final_line_total
* note

Options snapshot:

* product_name_snapshot
* price_snapshot
* quantity

---

# 5. Order Status Log

Track history of order status changes.

Fields:

* order_id
* old_status
* new_status
* changed_by
* note

---

# 6. Payment

Payment transactions for orders.

Fields:

* franchise_id
* order_id
* method (CASH / CARD / MOMO / VNPAY)
* amount
* status (PENDING / SUCCESS / FAILED / REFUNDED)
* provider_txn_id
* paid_at
* created_by

Relationship:

Order → 1:N Payments

---

# 7. Refund

Refund records for payments.

Fields:

* payment_id
* amount
* reason
* status (REQUESTED / APPROVED / REJECTED / COMPLETED)
* created_by
* refunded_at

Relationship:

Payment → 1:N Refund

---

# 8. Delivery

Delivery tracking for online orders.

Fields:

* order_id
* customer_id
* assigned_to
* status (ASSIGNED / PICKING_UP / DELIVERED / FAILED)
* picked_up_at
* delivered_at
* failed_reason

---

# 9. CustomerFranchise

Represents relationship between customer and franchise.

Fields:

* customer_id
* franchise_id
* loyalty_points
* current_tier
* total_earned_points
* total_orders
* total_spent
* first_order_date
* last_order_date

Unique index:

(customer_id, franchise_id)

---

# 10. LoyaltyRule

Defines loyalty program rules per franchise.

Earn rule:

* earn_amount_per_point

Redeem rule:

* redeem_value_per_point
* min_redeem_points
* max_redeem_points

Tier rules:

* tier
* min_points
* max_points
* order_discount_percent
* earn_multiplier
* benefit_note

---

# 11. LoyaltyTransaction

Tracks all loyalty point changes.

Fields:

* customer_franchise_id
* order_id
* type (EARN / REDEEM / ADJUST)
* point_change
* reason
* created_by

---

# System Relationship Overview

Customer
│
└── CustomerFranchise
│
├── LoyaltyTransaction
│
└── Orders
│
├── OrderItems
├── Payments
│        └── Refunds
│
└── Delivery
