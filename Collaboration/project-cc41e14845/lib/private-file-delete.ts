type StoredPrivateFile = {
  body: ReadableStream<Uint8Array>;
};

export type PrivateFileBucket = {
  get(key: string): Promise<StoredPrivateFile | null>;
  put(key: string, value: ArrayBuffer, options: { httpMetadata: { contentType: string } }): Promise<unknown>;
  delete(key: string): Promise<void>;
};

export class PrivateFileMetadataDeleteError extends Error {
  public readonly metadataError: unknown;
  public readonly rollbackSucceeded: boolean;

  constructor(
    metadataError: unknown,
    rollbackSucceeded: boolean,
  ) {
    super("Private file metadata cleanup failed after object deletion.");
    this.metadataError = metadataError;
    this.rollbackSucceeded = rollbackSucceeded;
  }
}

type DeletePrivateFileOptions = {
  bucket: PrivateFileBucket;
  storageKey: string;
  contentType: string;
  deleteMetadata: () => Promise<void>;
};

// R2 and D1 cannot participate in one transaction. Keep an in-memory copy of
// the (at most 10 MB) private object so a D1 failure does not leave a download
// record that points at an already-deleted object.
export async function deletePrivateFileWithMetadataRollback({
  bucket,
  storageKey,
  contentType,
  deleteMetadata,
}: DeletePrivateFileOptions): Promise<void> {
  const storedFile = await bucket.get(storageKey);
  const backup = storedFile ? await new Response(storedFile.body).arrayBuffer() : null;

  await bucket.delete(storageKey);
  try {
    await deleteMetadata();
  } catch (metadataError) {
    if (backup === null) {
      // The metadata remains available for a retry. The object was already
      // absent before this request, so there is nothing to restore.
      throw new PrivateFileMetadataDeleteError(metadataError, true);
    }

    try {
      await bucket.put(storageKey, backup, { httpMetadata: { contentType } });
    } catch (rollbackError) {
      console.error("Private file restore failed after metadata cleanup failure", rollbackError);
      throw new PrivateFileMetadataDeleteError(metadataError, false);
    }
    throw new PrivateFileMetadataDeleteError(metadataError, true);
  }
}
