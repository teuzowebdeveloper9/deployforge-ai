import { ProjectWorkspace } from "@/components/ProjectWorkspace";

export default function AgentPage({ params }: { params: { appId: string } }) {
  return <ProjectWorkspace appId={params.appId} />;
}
