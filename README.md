# HuaweiCloud OBS Helper
[对象存储服务（Object Storage Service，OBS）](https://www.huaweicloud.com/product/obs.html)是一个基于对象的海量存储服务，为客户提供海量、安全、高可靠、低成本的数据存储能力。
您可以使用[OBS Helper action](https://github.com/marketplace/actions/huaweicloud-obs-helper)实现如下对OBS的操作：  
1、上传文件/文件夹  
2、下载文件/文件夹  
3、创建桶  
4、删除桶  
本项目说明文件仅做基础功能示例，具体不同场景下时样例及其参数使用请访问[OBS Helper Workflow Sample](https://github.com/huaweicloud/obs-helper-workflow-sample)  
## **前置工作**
1、需要开通华为云的OBS服务，进行对象操作时需要建好桶。[OBS主页](https://www.huaweicloud.com/product/obs.html)，[OBS文档](https://support.huaweicloud.com/obs/)；  
2、action调用华为云接口需要华为云鉴权，建议将您华为云账户的ak/sk配置于您GitHub工程中的settting-Secret-Actions，分别添加为ACCESSKEY、SECRETACCESSKEY以加密使用，[获取ak/sk方式](https://support.huaweicloud.com/api-obs/obs_04_0116.html)；  
3、注意替换参数region和参数bucket_name为自己OBS服务的真实region和桶名（创建桶时为要创建的桶名）；  
## **上传下载对象参数说明**
|  参数名称  |  参数说明  |  默认值  |  是否必填  |
|  :----:  |  ----  |  :----: |  :----:  |
| access_key  | 访问密钥ID。与私有访问密钥关联的唯一标识符，和私有访问密钥(secret_key)一起使用，对请求进行加密签名。建议参照**前置工作**中的步骤2进行设置以加密使用。 |  无  |  是  |
| secret_key  | 与访问密钥ID(access_key)结合使用的私有访问密钥，对请求进行加密签名，可标识发送方，并防止请求被修改。建议参照**前置工作**中的步骤2进行设置以加密使用。 |  无  |  是  |
| region  | OBS服务所在区域 |  'cn-north-4'  |  是  |
| bucket_name  | OBS的目标桶名 |  无  |  是  |
| operation_type  | 要进行的操作，上传请使用*upload*，下载请使用*download* |  无  |  是  |
| local_file_path  | 对象的本地路径，上传对象时可填写多个 |  无  |  是  |
| obs_file_path  | 对象在桶内的路径 |  无  |  下载时必填  |
| include_self_folder  | 上传/下载文件夹时是否包含文件夹自身，不填时默认不包含 |  false  |  否  |
| exclude  | 下载对象时，要排除的对象，上传时无用，不填时默认不排除 |  无  |  否  |

> 请注意，上传/下载时，地址类参数请不要使用操作系统独有的地址符号（如Linux系统的'\~，会被识别成名为'\~'的文件夹'）。如果想便捷使用某个地址，建议使用[action提供的上下文参数](https://docs.github.com/cn/actions/learn-github-actions/contexts#github-context)中提供的地址上下文，或者设置此地址为env参数，例如：

```yaml
name: Show Paths
on:
  push:
    branches:
        master
env: 
  HOME_DIR: /home/{your_username}
jobs:
  Show-Paths:
    runs-on: ubuntu-latest
    steps:
      # 环境变量使用示例
      - name: echo env variable
        run: echo ${{ env.HOME_DIR }}

      # 上下文使用示例，此处为action运行时的工作目录
      - name: echo workspace
        run: echo ${{ github.workspace }}
```
## **创建删除桶参数说明**
|  参数名称  |  参数说明  |  默认值  |  是否必填  |
|  :----:  |  ----  |  :----: |  :----:  |
| access_key  | 访问密钥ID。与私有访问密钥关联的唯一标识符，和私有访问密钥(secret_key)一起使用，对请求进行加密签名。建议参照**前置工作**中的步骤2进行设置以加密使用。 |  无  |  是  |
| secret_key  | 与访问密钥ID(access_key)结合使用的私有访问密钥，对请求进行加密签名，可标识发送方，并防止请求被修改。建议参照**前置工作**中的步骤2进行设置以加密使用。 |  无  |  是  |
| region  | OBS服务所在区域 |  'cn-north-4'  |  是  |
| bucket_name  | OBS的目标桶名 |  无  |  是  |
| operation_type  | 要进行的操作，创建桶请使用*createbucket*，删除桶请使用*deletebucket* |  无  |  是  |
| public_read  | 创建桶时，是否开放桶公共读权限，不填时默认不开放。如需设置其他权限，请在创建桶后到控制台进行修改 |  false  |  否  |
| storage_class  | 创建桶时，桶的存储类型，不填时默认为*标准存储*|  无  |  否  |
| clear_bucket  | 删除桶时，是否清空桶内全部对象/碎片，不填时默认清空 |  true  |  否  |


目前OBS支持的区域名称和对应region如下
```text
  非洲-约翰内斯堡：  af-south-1	
  华北-北京四：	 cn-north-4	
  华北-北京一：	 cn-north-1	
  华北-乌兰察布一：  cn-north-9	
  华东-上海二：	 cn-east-2	
  华东-上海一：	 cn-east-3	
  华南-广州：	 cn-south-1	
  拉美-墨西哥城二：  la-north-2	
  拉美-墨西哥城一：  na-mexico-1	
  拉美-圣保罗一：  sa-brazil-1	
  拉美-圣地亚哥：  la-south-2	
  西南-贵阳一：	 cn-southwest-2	
  亚太-曼谷：	 ap-southeast-2	
  亚太-新加坡：	 ap-southeast-3	
  中国-香港：	 ap-southeast-1	
```
目前OBS支持的存储类型(storage_class)如下
```text
  标准存储： standard
  低频访问存储： infrequent
  归档存储： archive
```
## **上传文件用法**
假设本地文件夹的格式如下：
```text
└── src1
    ├── src2
          ├── test1.txt
          └── test2.txt
    └── src3
          └── test3.txt
```

### 上传文件
```yaml
jobs:
  upload_file:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: upload_file_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'cn-north-4'
          bucket_name: 'bucket-test'
          local_file_path: 'src1/src2/test1.txt'
          obs_file_path: ''
          operation_type: 'upload'
```
成功上传后，桶内生成对象为：
```text
/obs://bucket-test/test1.txt
```

### 上传文件夹(包含文件夹自身)
```yaml
jobs:
  upload_folder:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: upload_folder_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'cn-north-4'
          bucket_name: 'bucket-test'
          local_file_path: 'src1/'
          obs_file_path: 'src'
          operation_type: 'upload'
          include_self_folder: true
```
成功上传后，桶内生成对象为：
```text
  src
    └── src1
          ├── src2
                ├── test1.txt
                └── test2.txt
          └── src3
                └── test3.txt
```

### 上传多个文件和文件夹(不包含文件夹自身)
```yaml
jobs:
  upload_files:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: upload_files_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'cn-north-4'
          bucket_name: 'bucket-test'
          local_file_path: |
            'src1/src2/test1.txt'
            'src1/src3'
          obs_file_path: 'src'
          operation_type: 'upload'
          include_self_folder: false
```
成功上传后，桶内生成对象为：
```text
  src 
    └── test1.txt
    └── src3
          └── test3.txt
```

## **下载文件用法**
假设bucket-test桶内包含如下对象：
```text
test1.txt
src1
  ├── src2
        ├── test2.txt
        └── test3.txt
  └── src3
        └── test4.txt
```

### 下载文件
```yaml
jobs:
  download_file:
    runs-on: ubuntu-latest
    steps:
      - name: Download File From HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: download_file_from_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'cn-north-4'
          bucket_name: 'bucket-test'
          local_file_path: 'src1/'
          obs_file_path: 'test1.txt'
          operation_type: 'download'
```
下载完成后，本地生成的文件为：
```text
└── src1
      └── test1.txt
```

### 下载文件夹(包含文件夹自身)
```yaml
jobs:
  download_folder:
    runs-on: ubuntu-latest
    steps:
      - name: Download From HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: download_folder_from_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'cn-north-4'
          bucket_name: 'bucket-test'
          local_file_path: 'src'
          obs_file_path: 'src1'
          operation_type: 'download'
          include_self_folder: true
```
下载完成后，本地生成的文件为：
```text
src
  └── src1
        ├── src2
              ├── test2.txt
              └── test3.txt
        └── src3
              └── test4.txt
```

### 下载文件夹(不包含文件夹自身，排除下载桶内src1/sr2/test3.txt和src1/src3目录下的所有文件)
```yaml
jobs:
  download_folder:
    runs-on: ubuntu-latest
    steps:
      - name: Download From HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: download_folder_from_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'cn-north-4'
          bucket_name: 'bucket-test'
          local_file_path: 'src'
          obs_file_path: 'src1'
          operation_type: 'download'
          include_self_folder: false
          exclude: |
            'src1/src2/test3.txt'
            'src1/src3'
```
下载完成后，本地生成的文件为：
```text
src
  └── src2
        └── test2.txt
```

## **创建桶用法**
创建新桶时，可指定是否开放桶公共读权限(public_read)和桶的存储类型(storage_class)。若不指定，默认不开放公共读权限，存储类型为标准存储(standard)。如需开放更多权限，请至obs控制台进行修改。  
### 创建名为'new-bucket'的桶（开放公共读、低频访问存储）
假设您的OBS中不存在名为'new-bucket'的桶
```yaml
jobs:
  create_bucket:
    runs-on: ubuntu-latest
    steps:
      - name: Create Bucket on HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: create_bucket_on_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'cn-north-4'
          bucket_name: 'new-bucket'
          operation_type: 'createBucket'
          public_read: true
          storage_class: 'infrequent'
```
执行成功后，OBS中会创建一个名为'new-bucket'、开放公共读权限，存储类型为低频访问存储的桶

## **删除桶用法**
删除桶操作默认会自动清空桶内所有对象和碎片，若您不确定桶内是否有重要对象未备份，请设置参数'clear_bucker'为false  
### 删除名为'new-bucket'的桶（自动清空桶内所有对象和碎片）
假设您的obs中存在名为'new-bucket'的桶
```yaml
jobs:
  delete_bucket:
    runs-on: ubuntu-latest
    steps:
      - name: Delete Bucket on HuaweiCloud OBS
        uses: huaweicloud/obs-helper@v1.2.0
        id: delete_bucket_on_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'cn-north-4'
          bucket_name: 'new-bucket'
          operation_type: 'deleteBucket'
```
执行成功后，您在obs的桶'new-bucket'以及其中所有对象和碎片将被删除