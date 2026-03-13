# Inventory & Stock Engine

This document describes how product inventory is managed in the system.

The inventory engine ensures that stock levels remain consistent when orders are created, completed, cancelled, or refunded.

---

# 1. Inventory Overview

Inventory tracks available quantity of products per franchise.

Stock is associated with:

* product
* franchise
* product variant (optional)

Example:

| Product  | Franchise    | Stock |
| -------- | ------------ | ----- |
| Coffee   | Highland 001 | 120   |
| Milk Tea | Highland 001 | 50    |

---

# 2. Inventory Model

Typical inventory fields:

* product_franchise_id
* franchise_id
* available_quantity
* reserved_quantity
* created_at
* updated_at

Meaning:

Available quantity

```id="u0xg5k"
Products available for new orders
```

Reserved quantity

```id="0z2t7y"
Products reserved by active orders
```

---

# 3. Stock Lifecycle

Stock changes during the order lifecycle.

Example flow:

```id="if9t2h"
Customer places order
        │
        ▼
Reserve stock
        │
        ▼
Order completed → Deduct stock
        │
        ▼
Order cancelled → Release stock
```

---

# 4. Stock Reservation

When checkout occurs, stock must be reserved before payment is finalized.

Example:

Product stock

```id="4pxsnr"
available_quantity = 10
```

Customer orders:

```id="ec2pxy"
3 items
```

Reservation result:

```id="l2d9um"
available_quantity = 7
reserved_quantity = 3
```

---

# 5. Stock Deduction

When order status becomes:

```id="q4y1q1"
COMPLETED
```

Reserved stock becomes permanently deducted.

Example:

Before deduction

```id="1e9n3y"
available_quantity = 7
reserved_quantity = 3
```

After deduction

```id="96iqns"
available_quantity = 7
reserved_quantity = 0
```

Stock total effectively reduced.

---

# 6. Stock Release

If an order is cancelled or payment fails, reserved stock must be released.

Example:

```id="70f8uk"
reserved_quantity = 3
```

After cancellation:

```id="qv0qls"
available_quantity += 3
reserved_quantity -= 3
```

---

# 7. Stock Validation

Before reserving stock, system must check availability.

Validation rule:

```id="r5w1gy"
available_quantity >= order_quantity
```

If not satisfied:

```id="q0ldse"
throw "OUT_OF_STOCK"
```

---

# 8. Inventory Log

Stock changes should be recorded for auditing.

InventoryLog fields:

* product_franchise_id
* change_type (RESERVE / RELEASE / DEDUCT / ADJUST)
* quantity_change
* order_id
* created_by
* created_at

Example:

| change_type | quantity | reason          |
| ----------- | -------- | --------------- |
| RESERVE     | -3       | order checkout  |
| DEDUCT      | -3       | order completed |
| RELEASE     | +3       | order cancelled |

---

# 9. Concurrency Protection

Multiple users may place orders simultaneously.

To prevent overselling, stock updates must be atomic.

Example rule:

```id="v14s2o"
available_quantity >= requested_quantity
```

Use atomic update:

```id="ypln1f"
$inc
```

Example:

```id="z0ir28"
update inventory
set available_quantity = available_quantity - 3
where available_quantity >= 3
```

If update fails, stock is insufficient.

---

# 10. Stock Engine Flow

```id="8kfl8r"
Add product to cart
      │
      ▼
Checkout
      │
      ▼
Reserve stock
      │
      ▼
Payment success
      │
      ▼
Order completed → Deduct stock
```

Cancellation flow:

```id="r62yzj"
Checkout
   │
   ▼
Reserve stock
   │
   ▼
Payment failed
   │
   ▼
Release stock
```

---

# 11. Best Practices

Always reserve stock before payment confirmation.

Use atomic database operations to avoid overselling.

Record every stock change in an inventory log.

Avoid calculating stock directly from order history.

---

# 12. Inventory Relationships

```id="qq7rjz"
Product
   │
   └── ProductFranchise
          │
          └── Inventory
                │
                └── InventoryLog
```
