# Promotion & Voucher Engine

This document describes how the system calculates and applies discounts.

The engine supports multiple discount sources:

* Promotion
* Voucher
* Loyalty Tier Benefit
* Loyalty Points Redemption

The system must apply them in a **consistent order** to prevent incorrect pricing.

---

# 1. Discount Sources

## Promotion

Automatic discount applied based on system rules.

Example:

* 10% off all drinks
* 5% off total order
* Buy 2 get 1 free

Promotion can be:

* Cart-level promotion
* Product-level promotion

Promotion fields:

* type (PERCENT / FIXED)
* value
* start_date
* end_date
* product_franchise_id (optional)

---

## Voucher

Manual discount applied by customer.

Examples:

* SAVE10 → 10% off
* 50KOFF → 50,000 VND off

Voucher fields:

* code
* type (PERCENT / FIXED)
* value
* quota_total
* quota_used
* start_date
* end_date

Validation rules:

```id="m0xsz6"
voucher exists
voucher active
within start_date and end_date
quota_used < quota_total
cart subtotal satisfies conditions
```

---

## Loyalty Tier Benefit

Discount based on customer tier.

Examples:

| Tier     | Benefit      |
| -------- | ------------ |
| BRONZE   | none         |
| SILVER   | 5% discount  |
| GOLD     | 10% discount |
| PLATINUM | 15% discount |

Tier rules are stored in `LoyaltyRule`.

Example fields:

* order_discount_percent
* earn_multiplier

---

## Loyalty Points Redemption

Customers can redeem points for discounts.

Example rule:

```id="g3cjq2"
1 point = 1,000 VND
```

Redeem validation:

```id="7v7q6b"
points >= min_redeem_points
points <= max_redeem_points
customer has enough points
```

---

# 2. Discount Calculation Order

Discounts must be applied in a fixed order.

Order of execution:

```id="b8y1bo"
1. Promotion
2. Voucher
3. Loyalty Tier Discount
4. Loyalty Points Redemption
```

Example calculation:

Cart subtotal

```id="h6f7o0"
100,000
```

Promotion (10%)

```id="t11a6y"
-10,000
```

Voucher (20,000)

```id="cl02ph"
-20,000
```

Tier discount (5%)

```id="nscs3y"
-3,500
```

Redeem points (10 points)

```id="o5tgh4"
-10,000
```

Final amount

```id="0m1j0n"
56,500
```

---

# 3. Discount Limits

System must prevent excessive discount stacking.

Common rules:

Maximum total discount

```id="vr4n02"
total_discount <= subtotal_amount
```

Voucher percent cap

Example:

```id="1qzpl3"
20% off
max_discount = 50,000
```

---

# 4. Promotion Logic

Promotion can apply to:

Cart level

Example:

```id="2iccrf"
10% off entire order
```

Product level

Example:

```id="9yzhsp"
20% off coffee
```

Product promotion only affects matching items.

---

# 5. Voucher Usage Rules

Voucher usage must be tracked.

When order completes:

```id="sm8e71"
voucher.quota_used += 1
```

Voucher should not be counted until order is confirmed.

---

# 6. Loyalty Discount Storage

Cart fields:

* promotion_discount
* voucher_discount
* loyalty_discount

Order stores snapshot:

* promotion_discount
* voucher_discount
* loyalty_discount

This ensures historical order pricing remains accurate.

---

# 7. Discount Engine Flow

```id="cbeyvx"
Cart subtotal
      │
      ▼
Apply Promotion
      │
      ▼
Apply Voucher
      │
      ▼
Apply Tier Discount
      │
      ▼
Apply Loyalty Points
      │
      ▼
Calculate Final Amount
```

---

# 8. Validation Rules

System must validate before applying discounts.

Rules:

```id="95y4go"
promotion active
voucher valid
loyalty points available
discount <= subtotal
```

---

# 9. Example Discount Scenario

Customer tier:

```id="7c0gsy"
GOLD
```

Benefits:

```id="j9n5a1"
10% tier discount
```

Cart:

```id="43p1c0"
subtotal = 200,000
```

Promotion:

```id="sr91g0"
10% promotion
```

Voucher:

```id="l9yzt3"
50,000 VND
```

Calculation:

```id="5x7eai"
promotion = 20,000
voucher = 50,000
tier_discount = 13,000
```

Final:

```id="v5n3uz"
117,000
```

---

# 10. Best Practices

Discount calculation must be centralized in a single service.

Never calculate discounts directly in controllers.

Always recalculate cart before checkout.

Store snapshot values in order to ensure historical accuracy.
