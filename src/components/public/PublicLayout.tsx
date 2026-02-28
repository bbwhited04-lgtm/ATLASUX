import { Outlet } from "react-router-dom";
import PublicFooter from "./PublicFooter";

export default function PublicLayout() {
  return (
    <>
      <Outlet />
      <PublicFooter />
    </>
  );
}
