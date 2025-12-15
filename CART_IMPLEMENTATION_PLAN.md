# Cart Implementation Plan for Multi-Duration Booking

## Current System
- User selects ONE duration (30min OR 60min)
- Selects consoles/quantities for that duration
- Goes to checkout with single duration booking

## Proposed System
- User can ADD multiple duration blocks to cart
- Each cart item = duration + consoles + quantities
- Checkout shows all cart items with edit/remove
- Total time = sum of all durations

## Implementation Steps

### 1. Update Types (book/page.tsx)
```typescript
type CartItem = {
  id: string; // unique cart item id
  duration: 30 | 60;
  console: ConsoleId;
  quantity: number;
  ticketId: string;
  title: string;
  price: number;
};
```

### 2. Update State Management
- Replace `selectedDuration` + `quantities` with `cart: CartItem[]`
- Add `currentDuration` for UI (which duration tab user is on)
- Add cart functions: `addToCart`, `removeFromCart`, `updateCart`

### 3. Update UI
- Duration selector becomes "Add to Cart" buttons
- Show cart summary above checkout button
- Display total time (e.g., "1.5 hours")
- Show breakdown: "30min: 2 PS5, 60min: 1 Xbox"

### 4. Update Checkout Page
- Accept array of cart items
- Show editable cart
- Allow removing individual items
- Recalculate total on changes

### 5. Database Schema (if needed)
- booking_items table already supports multiple items
- Each cart item becomes a booking_item row
- Store duration in booking_items

## Alternative Simpler Approach
Instead of complex cart, allow booking BOTH durations simultaneously:
- Show 30min tickets AND 60min tickets on same page
- User selects from both sections
- Checkout shows "30min session" + "60min session" breakdown
- Creates 2 separate booking records (30min + 60min)

This is simpler and doesn't require major refactoring.
