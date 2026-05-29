import { AppNav } from "@/components/AppNav";
import { AppOverviewClient } from "@/components/AppOverviewClient";

export default function AppPage({ params }: { params: { appId: string } }) {
  return (
    <div>
      <AppNav appId={params.appId} />
      <AppOverviewClient appId={params.appId} />
    </div>
  );
}
