export class AppVersionEntity {
  constructor(
    public readonly id: string,
    public readonly appId: string,
    public readonly versionNumber: number,
    public readonly storagePath: string,
    public readonly checksum: string,
    public readonly status: string,
    public readonly qualityScore: number | null,
    public readonly createdAt: Date,
    public readonly createdBy: string
  ) {}
}
