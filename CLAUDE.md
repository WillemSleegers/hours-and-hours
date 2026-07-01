# Development Guidelines

## Project Architecture

This is a time tracking app centered around slot-based time tracking.

### Key Design Principles

1. **Touch-first interaction**: The UI is optimized for touch screens with tap-based interactions
2. **Slot-based architecture**: Individual 15-minute slots are the atomic unit, not entries or ranges
3. **Collapsible UI pattern**: Actions (notes, delete) are hidden in expandable sections to keep the interface clean
4. **Optimistic updates**: All mutations update the UI immediately and sync with Supabase in the background

## Documentation

- Keep the **Design Philosophy** section in README.md up to date with the current interaction model
- Document the "why" behind design decisions, not just the "what"
