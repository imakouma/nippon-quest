# Capability Map: Town and Player UI Repairs

| Module id        | Responsibility                                                               | Depends on |
| ---------------- | ---------------------------------------------------------------------------- | ---------- |
| `town-collision` | Make town collision match visible obstacles across generated town maps.      | —          |
| `appearance-ui`  | Rework the existing player appearance editor into a clear responsive layout. | —          |
| `drag-equip`     | Add pointer drag-and-drop to the existing bag/equipment movement rules.      | —          |

Build order: `town-collision` → `appearance-ui` → `drag-equip` → shared end-to-end verification.
