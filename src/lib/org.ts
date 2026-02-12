export function getOrgUser() {
  const org_id = localStorage.getItem("atlasux_org_id") || "demo_org";
  const user_id = localStorage.getItem("atlasux_user_id") || "demo_user";
  return { org_id, user_id };
}
