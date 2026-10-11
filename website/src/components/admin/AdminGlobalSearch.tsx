export function AdminGlobalSearch() {
  return (
    <form method="get" action="/admin/search" className="admin-sidebar-search">
      <label htmlFor="admin-sidebar-search" className="sr-only">
        Search admin
      </label>
      <input
        id="admin-sidebar-search"
        name="q"
        type="search"
        placeholder="Search…"
        autoComplete="off"
      />
    </form>
  );
}
