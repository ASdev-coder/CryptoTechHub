using Amazon.S3;
using Amazon.S3.Transfer;
using Microsoft.Extensions.Configuration;
using TechChainMarket.Core.Interfaces;

namespace TechChainMarket.Infrastructure.Services;

public class S3StorageService : IFileStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;

    public S3StorageService(IAmazonS3 s3Client, IConfiguration config)
    {
        _s3Client = s3Client;
        _bucketName = config["AWS:BucketName"] ?? "";
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        var fileTransferUtility = new TransferUtility(_s3Client);
        
        var uniqueName = $"{Guid.NewGuid()}_{fileName}";

        var uploadRequest = new TransferUtilityUploadRequest
        {
            InputStream = fileStream,
            Key = uniqueName,
            BucketName = _bucketName,
            ContentType = contentType,
            CannedACL = S3CannedACL.PublicRead
        };

        await fileTransferUtility.UploadAsync(uploadRequest);
        
        return $"https://{_bucketName}.s3.amazonaws.com/{uniqueName}";
    }

    public async Task DeleteFileAsync(string fileUrl)
    {
        var key = fileUrl.Split('/').Last();
        await _s3Client.DeleteObjectAsync(_bucketName, key);
    }
}