# Development Guidelines

## Project Architecture

This is a time tracking app built with:
- **Next.js 16** with React 19 and React Compiler
- **Supabase** for database and authentication
- **Tailwind CSS 4** with shadcn/ui components
- **Slot-based time tracking**: Individual 15-minute slots stored in the database, visually grouped in the UI

### Key Design Principles

1. **Touch-first interaction**: The UI is optimized for touch screens with tap-based interactions
2. **Slot-based architecture**: Individual 15-minute slots are the atomic unit, not entries or ranges
3. **Collapsible UI pattern**: Actions (notes, delete) are hidden in expandable sections to keep the interface clean
4. **Optimistic updates**: All mutations update the UI immediately and sync with Supabase in the background

## Code Cleanliness

Always maintain clean code by removing unused components, functions, and imports when they are no longer needed. When refactoring or moving functionality:

1. Remove the original implementation files if they're completely replaced
2. Remove unused imports from all files
3. Delete unused utility functions, hooks, or components
4. Keep the codebase minimal and intentional

This ensures the codebase remains maintainable and easy to understand.

## After Major Refactoring

When completing a major refactoring or feature change:

1. **Search for unused code**: Use grep/glob to find references to old interfaces, functions, or types
2. **Clean up TypeScript types**: Remove interfaces and types that are no longer used
3. **Simplify hook returns**: Remove exports from hooks that are no longer imported anywhere
4. **Update dependencies**: Run `npm outdated` and update packages to latest versions
5. **Verify the build**: Run `npm run build` to ensure no errors or warnings
6. **Commit cleanly**: Create separate commits for feature work vs cleanup/updates

## Documentation

- Keep the **Design Philosophy** section in README.md up to date with the current interaction model
- Document the "why" behind design decisions, not just the "what"
