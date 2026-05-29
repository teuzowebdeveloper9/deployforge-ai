import { AgentClient } from "@/components/AgentClient";
import { AppNav } from "@/components/AppNav";

export default function AgentPage({ params }: { params: { appId: string } }) {
  return (
    <div>
      <AppNav appId={params.appId} />
      <AgentClient appId={params.appId} />
    </div>
  );
}
