# CAP Theorem Analysis

## 1. Stock Trading Platform

**Priority:** CP (Consistency + Partition Tolerance)
**Reason:** Accurate data is critical; cannot tolerate inconsistency in trades.

## 2. Content Delivery Network

**Priority:** AP (Availability + Partition Tolerance)
**Reason:** Content should always be accessible even if slightly outdated.

## 3. Airline Booking System

**Priority:** CP
**Reason:** Seat booking must be consistent to avoid double booking.

## 4. Video Streaming Service

**Priority:** AP
**Reason:** Availability is more important than perfect consistency.
