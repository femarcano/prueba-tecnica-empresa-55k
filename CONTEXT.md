# Users Directory

Displays a sortable, filterable, deletable table of users fetched from randomuser.me.

## Language

**User**:
A person record returned by the upstream users API.
_Avoid_: Person, Member, Customer

**fetchUsers**:
The single data-source function for the users list. Calls the orval-generated `getRandomUsers` client and Zod-parses the response. Lives at `src/apis/usersCache/fetchUsers.ts`. There is no module wrapping it and no interface around it — until a second adapter shows up (in-memory, server-side, etc.) the seam doesn't exist.

**Fake**:
Withdrawn. The codebase no longer keeps a second adapter; tests stub the network seam (`vi.stubGlobal("fetch", ...)`) instead. Reintroduce the term if a second adapter is added at the data-source seam.
_Avoid_: Mock, Stub
