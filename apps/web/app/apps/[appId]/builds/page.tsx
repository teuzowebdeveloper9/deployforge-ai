import { AppNav } from "@/components/AppNav";
import { BuildsClient } from "@/components/BuildsClient";

export default function BuildsPage({ params }: { params: { appId: string } }) {
  return (
    <div>
      <AppNav appId={params.appId} />
      <BuildsClient appId={params.appId} />
    </div>
  );
}
