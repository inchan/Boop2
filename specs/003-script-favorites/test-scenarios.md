### TC-FAV-013: Reassign Number via Hover + Key Press

**Given** favorites exist with current assignments

```
A → Cmd+1
B → Cmd+2
C → Cmd+3
```

**When** hovering over A and pressing '2'
**Then** A is reassigned to Cmd+2
**And** B is reassigned to Cmd+1 (swap)
**And** both updated at the same time

### TC-FAV-014: Reassign Number via Number Picker Click

**Given** favorites exist
**When** hovering over favorite and clicking number in picker
**Then** favorite is reassigned to that number
**And** if number was occupied, the other favorite gets swapped

### TC-FAV-015: Number Picker Shows Occupied State

**Given** favorites are assigned to numbers 1, 2, 3
**When** hovering over favorite with Cmd+1
**Then** number picker shows:

```
[1] [2] [3] [4] [5]
 ↑    ↑    ↑   ○   ○
Current Occupied Empty
```

**And** occupied numbers are disabled
**And** empty numbers are clickable
