import stream from 'stream';

export interface Inputs {
    access_key: string, 
    secret_key: string, 
    bucket_name: string,
    operation_type: string,
    region: string, 
    local_file_path: string[], 
    obs_file_path: string,
    // 是否包含文件夹自身
    include_self_folder?: string, 
    // 下载时要排除的文件夹/文件
    exclude?: string[] 
}

export interface CommonResult {
    CommonMsg: CommonMsg,
    InterfaceResult: CommonInterfaceResult
}

export interface CommonMsg {
    Status: number,
    Code: string,
    Message: string,
    HostId: string,
    RequestId: string,
    Id2: string,
    Indicator: string
}

export interface CommonInterfaceResult {
    RequestId: string,
    Id2: string
}

export interface ListBucketResult {
    CommonMsg: CommonMsg,
    InterfaceResult: ListBucketInterfaceResult
}

export interface ListBucketInterfaceResult extends CommonInterfaceResult {
    RequestId: string,
    Location: string,
    Bucket: string,
    Delimiter: string,
    IsTruncated: string,
    Prefix: string,
    Marker: string,
    NextMarker: string,
    MaxKeys: string,
    Contents: ObjectItem[],
    CommonPrefixes: string[]
}

export interface ObjectItem {
    ETag: string,
    Size: string,
    Key: string,
    LastModified: string,
    Owner: {
        ID: string
    },
    StorageClass: string,
    Type: string
}

export interface PutObjectResult {
    CommonMsg: CommonMsg,
    InterfaceResult: PutObjectInterfaceResult
}

export interface PutObjectInterfaceResult extends CommonInterfaceResult {
    RequestId: string,
    ETag: string,
    VersionId: string,
    StorageClass: string,
    SseKms: string,
    SseKmsKey: string,
    SseC: string,
    SseCKeyMd5: string
}

export interface GetObjectResult {
    CommonMsg: CommonMsg,
    InterfaceResult: GetObjectInterfaceResult
}

export interface GetObjectInterfaceResult {
    RequestId: string,
    DeleteMarker: string,
    LastModified: string,
    ContentLength: string,
    CacheControl: string,
    ContentDisposition: string,
    ContentEncoding: string,
    ContentLanguage: string,
    ContentType: string,
    Expires: string,
    ETag: string,
    VersionId: string,
    WebsiteRedirectLocation: string,
    StorageClass: string,
    Restore: string,
    AllowOrigin: string,
    AllowHeader: string,
    AllowMethod: string,
    ExposeHeader: string,
    MaxAgeSeconds: string,
    SseKms: string,
    SseKmsKey: string,
    SseC: string,
    SseCKeyMd5: string,
    Expiration: string,
    Content: string | stream.Readable,
    // Metadata参数官网描述类型为Object, 描述为'对象自定义元数据',未明确说明包含数据类型
    Metadata: any 
}

export interface UploadFileList {
    file: UploadFile[],
    folder: string[]
}

export interface UploadFile {
    local: string,
    obs: string
}