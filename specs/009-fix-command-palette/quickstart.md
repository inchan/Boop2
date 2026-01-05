# Quickstart: Command Palette Fixes

## Verification Steps

### 1. Script List Visibility

- Press `Cmd+B`.
- Scroll through "ALL SCRIPTS".
- Verify all 73 bundled scripts are present.
- Verify NO "FAVORITES" section is visible.

### 2. Recent Scripts Functionality

- Execute any script from "ALL SCRIPTS".
- Press `Cmd+B` again.
- Verify the executed script appears in the "RECENT" section at the top.
- Verify the "RECENT" section has an "X" button for each item.
- Click the "X" button on a recent item and verify it is removed from the section.

### 3. Search Behavior

- Type a query (e.g., "json") in the search box.
- Verify both "RECENT" and "ALL SCRIPTS" sections filter to show only matching items.

### 4. Layout Alignment

- Check the "X" button in the top right of the palette; it should be vertically centered in the header.
- Compare a row in "RECENT" (with an X) to a row in "ALL SCRIPTS" (without an X).
- The script icons and names should be perfectly aligned horizontally.

## CSS Inspection

- Inspect `.command-palette-header` and check `align-items: center`.
- Inspect `.command-item` and verify the action button container has fixed dimensions.
