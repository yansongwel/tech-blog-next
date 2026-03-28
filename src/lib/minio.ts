import * as Minio from "minio";

const globalForMinio = globalThis as unknown as {
  minio: Minio.Client | undefined;
};

export const minioClient =
  globalForMinio.minio ??
  new Minio.Client({
    endPoint: process.env.S3_ENDPOINT?.replace(/^https?:\/\//, "") || "localhost",
    port: parseInt(process.env.S3_PORT || "9000"),
    useSSL: process.env.S3_ENDPOINT?.startsWith("https") || false,
    accessKey: process.env.S3_ACCESS_KEY || "minioadmin",
    secretKey: process.env.S3_SECRET_KEY || "minioadmin",
  });

if (process.env.NODE_ENV !== "production") globalForMinio.minio = minioClient;

export const BUCKET = process.env.S3_BUCKET || "techblog";

export async function ensureBucket() {
  const exists = await minioClient.bucketExists(BUCKET);
  if (!exists) {
    await minioClient.makeBucket(BUCKET);
    // Set public read policy
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(BUCKET, JSON.stringify(policy));
  }
}
