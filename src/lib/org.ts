export function getOrgUser() {
  // Use the real tenant UUID — same key as useActiveTenant()
  const tenantId =
    localStorage.getItem("atlas_active_tenant_id") ||
    localStorage.getItem("atlasux_org_id") ||
    "";

  // user_id == tenantId until proper per-user auth is added
  return { org_id: tenantId, user_id: tenantId };
}
