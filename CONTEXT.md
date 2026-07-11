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
A concrete implementation that satisfies a module interface at a seam. In this codebase: `HttpUsersRepository` (production) and `FakeUsersRepository` (test fixture).
_Avoid_: Implementation, Provider, Driver

**Fake**:
A deterministic in-process adapter used for tests. Returns a hardcoded set of users with no network or IO.
_Avoid_: Mock, Stub