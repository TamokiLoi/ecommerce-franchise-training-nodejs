# Order State Machine

This document defines the lifecycle of an order.

The order state machine ensures that order status transitions follow valid rules.

---

# 1. Order Status

Possible order states:

```
DRAFT
CONFIRMED
PREPARING
READY_FOR_PICKUP
OUT_FOR_DELIVERY
COMPLETED
CANCELED
```

---

# 2. State Description

## DRAFT

Temporary order created but not finalized.

Usually used in POS systems.

---

## CONFIRMED

Order has been successfully created.

Actions:

* OrderItems created
* Payment record created

---

## PREPARING

Kitchen or staff is preparing the order.

---

## READY_FOR_PICKUP

Order is ready.

Meaning depends on order type.

POS order

```
Customer picks up at counter
```

ONLINE order

```
Driver arrives to pick up
```

---

## OUT_FOR_DELIVERY

Driver has picked up the order and is delivering it.

---

## COMPLETED

Order finished successfully.

Actions triggered:

* Loyalty points granted
* Analytics updated
* Order locked

---

## CANCELED

Order cancelled by customer or staff.

Possible reasons:

* Payment failed
* Customer cancelled
* Restaurant rejected order

---

# 3. State Transition Diagram

```
DRAFT
 │
 ▼
CONFIRMED
 │
 ▼
PREPARING
 │
 ▼
READY_FOR_PICKUP
 │
 ├───────────────┐
 ▼               ▼
OUT_FOR_DELIVERY COMPLETED
 │
 ▼
COMPLETED
```

Cancellation path:

```
DRAFT
CONFIRMED
PREPARING
READY_FOR_PICKUP
        │
        ▼
     CANCELED
```

---

# 4. Delivery Interaction

Delivery status affects order status.

Mapping example:

| Delivery Status | Order Status     |
| --------------- | ---------------- |
| ASSIGNED        | READY_FOR_PICKUP |
| PICKING_UP      | OUT_FOR_DELIVERY |
| DELIVERED       | COMPLETED        |
| FAILED          | READY_FOR_PICKUP |

---

# 5. State Validation Rules

Invalid transitions must be prevented.

Examples of invalid transitions:

```
COMPLETED → PREPARING
CANCELED → COMPLETED
```

Order status should only move forward in the workflow.

---

# 6. Order Status Logging

Every status change must create a log entry.

Fields recorded:

* order_id
* old_status
* new_status
* changed_by
* note
* created_at

This enables audit tracking and debugging.

---

# 7. Example Order Lifecycle

Example ONLINE order:

```
CONFIRMED
↓
PREPARING
↓
READY_FOR_PICKUP
↓
OUT_FOR_DELIVERY
↓
COMPLETED
```

Example POS order:

```
DRAFT
↓
CONFIRMED
↓
PREPARING
↓
READY_FOR_PICKUP
↓
COMPLETED
```

---

# 8. Best Practices

Always log status changes.

Order state transitions must be validated in the service layer.

Once an order reaches COMPLETED, it should become immutable.
