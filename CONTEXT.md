# Users Directory

Displays a sortable, filterable, deletable table of users fetched from randomuser.me.

## Language

**User**:
A person record returned by the upstream users API.
_Avoid_: Person, Member, Customer

**UsersRepository**:
A module that fetches the list of users. The shape that produces the data, not the data itself.
_Avoid_: UsersService, UsersAPI, UsersClient

**Adapter**:
A concrete implementation that satisfies a module interface at a seam. In this codebase: `HttpUsersRepository` (production). Tests stub `globalThis.fetch` rather than substitute a second adapter.
_Avoid_: Implementation, Provider, Driver

**Fake**:
Withdrawn. The codebase no longer keeps a second adapter; tests stub the network seam (`vi.stubGlobal("fetch", ...)`) instead. Reintroduce the term if a second adapter is added at the data-source seam.
_Avoid_: Mock, Stub
