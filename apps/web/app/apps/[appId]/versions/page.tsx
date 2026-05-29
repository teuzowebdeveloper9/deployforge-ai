import { AppNav } from "@/components/AppNav";
import { VersionsClient } from "@/components/VersionsClient";

export default function VersionsPage({ params }: { params: { appId: string } }) {
  return (
    <div>
      <AppNav appId={params.appId} />
      <VersionsClient appId={params.appId} />
    </div>
  );
}
