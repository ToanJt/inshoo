// page.tsx
import HomeClient from "@/components/HomeClient"; // move toàn bộ code hiện tại vào đây
export const dynamic = "force-dynamic";
export default function Page() {
  return <HomeClient />;
}
