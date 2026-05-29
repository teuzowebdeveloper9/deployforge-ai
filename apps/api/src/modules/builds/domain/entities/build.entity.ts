export class BuildEntity {
  constructor(
    public readonly id: string,
    public readonly appId: string,
    public readonly versionId: string | null,
    public readonly status: string,
    public readonly type: string,
    public readonly logsPath: string | null,
    public readonly reportPath: string | null,
    public readonly startedAt: Date | null,
    public readonly finishedAt: Date | null
  ) {}
}
