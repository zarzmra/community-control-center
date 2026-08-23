# Modular Domain Features

This directory is designed to house the business logic, modular components, services, and hooks, grouped by feature or domain. This avoids having a flat structure in the global components directory and keeps domain code self-contained.

## Proposed Modules
- **dashboard**: Main dashboard view, metrics, and global monitoring.
- **communities**: Community profile management, configurations, and settings.
- **bots**: Bot management, event routing, and connection status.
- **channels**: Multi-channel integration (WhatsApp, Clip, payments) once introduced.

## Directory Structure Per Module
Each module can have:
- `components/`: Module-specific UI components.
- `hooks/`: Domain-specific hooks.
- `services/`: API client services, webhook handlers, or third-party SDK wrappers.
- `types/`: Module-specific TypeScript interfaces.
