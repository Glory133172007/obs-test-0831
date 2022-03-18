# Huawei obs-helper
obs-helper action用于访问管理华为云对象存储服务（[Object Storage Service，OBS](https://www.huaweicloud.com/product/obs.html)），您可以使用该action对OBS进行上传文件/文件夹、下载文件/文件夹。

## **上传文件用法**
假设本地文件夹的格式如下：
```text
└── src1
    ├── src2
        └── test1.txt
        └── test2.txt
    ├── src3
        └── test3.txt
```

### 上传文件
```yaml
jobs:
  upload_file:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To Huawei OBS
        uses: huaweicloud/obs-helper@v1.0.0
        id: upload_file_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: region
          bucket_name: bucket-test
          local_file_path: src1/src2/test1.txt
          operation_type: upload
```
成功上传后，桶内生成对象为：
```text
/obs://bucket-test/test1.txt
```

### 上传文件夹
```yaml
jobs:
  upload_file:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To Huawei OBS
        uses: huaweicloud/obs-helper@v1.0.0
        id: upload_file_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'region'
          bucket_name: 'bucket-test'
          local_file_path: 'src1/'
          obs_file_path: 'src'
          operation_type: upload
```
成功上传后，桶内生成对象为：
```text
  src
    └── src1
        ├── src2
            └── test1.txt
            └── test2.txt
        ├── src3
            └── test3.txt
```

## **下载文件用法**
假设bucket-test桶内包含如下对象：
```text
test1.txt
src1
├── src2
    └── test2.txt
    └── test3.txt
├── src3
    └── test4.txt
```

### 下载文件
```yaml
jobs:
  upload_file:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To Huawei OBS
        uses: huaweicloud/obs-helper@v1.0.0
        id: upload_file_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: region
          bucket_name: bucket-test
          local_file_path: src1/
          obs_file_path: test1.txt
          operation_type: download
```
下载完成后，本地生成的文件为：
```text
└── src1
    └── test1.txt
```

### 下载文件夹
```yaml
jobs:
  upload_file:
    runs-on: ubuntu-latest
    steps:
      - name: Upload To Huawei OBS
        uses: huaweicloud/obs-helper@v1.0.0
        id: upload_file_to_obs
        with:
          access_key: ${{ secrets.ACCESSKEY }}
          secret_key: ${{ secrets.SECRETACCESSKEY }}
          region: 'region'
          bucket_name: 'bucket-test'
          local_file_path: 'src1/'
          obs_file_path: 'src'
          operation_type: upload
```
下载完成后，本地生成的文件为：
```text
src
    └── src1
        ├── src2
            └── test1.txt
            └── test2.txt
        ├── src3
            └── test3.txt
```
