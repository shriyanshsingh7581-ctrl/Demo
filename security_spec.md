# Security Specification — Eden Roses Makeover

## 1. Data Invariants
1. Every document ID (`bookingId`, `customerId`, `settingId`) must match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters (`isValidId`).
2. Every `Booking` document in `/bookings/{bookingId}` must contain all required fields (`id`, `customerName`, `phone`, `whatsapp`, `address`, `eventType`, `services`, `date`, `time`, `itemsTotal`, `discount`, `advancePaid`, `amountToCollect`, `notes`, `status`, `bookingSource`, `assignedTeam`, `createdAt`, `updatedAt`), enforce strict allowed keys via `.hasOnly()`, enforce bounded string lengths (`.size()`), and constrain array lengths (`services.size() <= 30`, `assignedTeam.size() <= 20`).
3. Every `CustomerLead` document in `/customers/{customerId}` must contain all required fields (`id`, `customerName`, `phone`, `whatsapp`, `address`, `eventType`, `message`, `source`, `createdAt`), enforce strict allowed keys via `.hasOnly()`, and enforce string `.size()` boundaries.
4. No shadow/ghost fields (such as `isAdmin: true` or `isVerified: true`) are permitted on any collection.

## 2. The "Dirty Dozen" Payloads
1. **Shadow Field Injection on Booking**: Booking payload with extra `"isSuperAdmin": true` -> Rejected by `.keys().hasOnly(...)`.
2. **Oversized Customer Name**: `customerName` with 5,000 characters -> Rejected by `data.customerName.size() <= 120`.
3. **Oversized Address**: `address` with 10,000 characters -> Rejected by `data.address.size() <= 500`.
4. **Invalid Event Type Enum**: `eventType: "HackedEvent"` -> Rejected by enum check.
5. **Invalid Booking Status Enum**: `status: "Pwned"` -> Rejected by status enum check.
6. **Unbounded Services Array**: `services` array with 100 items -> Rejected by `data.services.size() <= 30`.
7. **Negative Items Total**: `itemsTotal: -5000` -> Rejected by `data.itemsTotal >= 0`.
8. **ID Poisoning**: Document ID with spaces/slashes or >128 chars -> Rejected by `isValidId(bookingId)`.
9. **Path/Payload ID Mismatch**: `data.id != bookingId` -> Rejected by `incoming().id == bookingId`.
10. **Immutable CreatedAt Modification on Update**: Changing `createdAt` during booking update -> Rejected by `incoming().createdAt == existing().createdAt`.
11. **Shadow Field on CustomerLead**: CustomerLead with `"role": "admin"` -> Rejected by `.keys().hasOnly(...)`.
12. **Type Poisoning on Phone**: `phone: 9845012345` (number instead of string) -> Rejected by `data.phone is string`.
