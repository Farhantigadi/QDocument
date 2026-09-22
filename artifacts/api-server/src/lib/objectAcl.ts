import { File } from '@google-cloud/storage';

const ACL_POLICY_METADATA_KEY = 'custom:aclPolicy';

export interface ObjectAclPolicy {
  owner: string;
  visibility: 'public' | 'private';
}

export async function setObjectAclPolicy(
  objectFile: File,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const [exists] = await objectFile.exists();
  if (!exists) throw new Error(`Object not found: ${objectFile.name}`);
  await objectFile.setMetadata({
    metadata: { [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy) },
  });
}

export async function getObjectAclPolicy(objectFile: File): Promise<ObjectAclPolicy | null> {
  const [metadata] = await objectFile.getMetadata();
  const value = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  return value ? JSON.parse(value as string) as ObjectAclPolicy : null;
}