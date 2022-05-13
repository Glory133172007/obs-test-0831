import { expect, test } from '@jest/globals';
import * as bucket from '../src/bucket';
import * as upload from '../src/upload';
import { Inputs } from '../src/types';

const ObsClient = require('esdk-obs-nodejs');
function getObsClient(inputs: Inputs) {
    return new ObsClient({
        access_key_id: inputs.access_key,       
        secret_access_key: inputs.secret_key,       
        server : `https://obs.${inputs.region}.myhuaweicloud.com`,
    });
}

// ------------------------------file---------------------------------

test('upload a exist file without rename to obs folder "obsTest1"', async () => {
    const inputs = {
        access_key: '******',
        secret_key: '******',
        bucket_name: '******',
        operation_type: 'upload',
        obs_file_path: 'obsTest1/file1.txt',
        local_file_path: ['resource/uploadDir/file1.txt'],
        region: 'cn-north-6',   
    }
    const obs = getObsClient(inputs);
    await upload.uploadFileOrFolder(obs, inputs);
    const objList = await bucket.listObjects(obs, inputs.bucket_name);
    expect(objList.indexOf('obsTest1/file1.txt')).toBeGreaterThan(-1);
});

test('upload a exist file and rename to obs root', async () => {
    const inputs = {
        access_key: '******',
        secret_key: '******',
        bucket_name: '******',
        operation_type: 'upload',
        obs_file_path: 'elif.txt',
        local_file_path: ['resource/uploadDir/file1.txt'],
        region: 'cn-north-6',   
    }
    const obs = getObsClient(inputs);
    await upload.uploadFileOrFolder(obs, inputs);
    const objList = await bucket.listObjects(obs, inputs.bucket_name);
    expect(objList.indexOf('elif.txt')).toBeGreaterThan(-1);
});

test('upload a nonexist file to obs root', async () => {
    const inputs = {
        access_key: '******',
        secret_key: '******',
        bucket_name: '******',
        operation_type: 'upload',
        obs_file_path: '',
        local_file_path: ['resource/uploadDir/file2.txt'],
        region: 'cn-north-6',
        include_self_folder: true
    }
    const obs = getObsClient(inputs);
    await upload.uploadFileOrFolder(obs, inputs);
    const objList = await bucket.listObjects(obs, inputs.bucket_name);
    expect(objList.indexOf('file2.txt')).toEqual(-1);
});

test('upload a big file to obs', async () => {
    const inputs = {
        access_key: '******',
        secret_key: '******',
        bucket_name: '******',
        operation_type: 'upload',
        obs_file_path: 'src/bigFile.zip',
        local_file_path: ['resource/bigFile.zip'],
        region: 'cn-north-6'
    }
    const obs = getObsClient(inputs);
    await upload.uploadFileOrFolder(obs, inputs);
    const objList = await bucket.listObjects(obs, inputs.bucket_name);
    expect(objList.indexOf('src/bigFile.zip')).toEqual(-1);
});

// ------------------------------folder---------------------------------

test('upload a exist empty folder to obs "obsTest2"', async () => {
    const inputs = {
        access_key: '******',
        secret_key: '******',
        bucket_name: '******',
        operation_type: 'upload',
        obs_file_path: 'obsTest2',
        local_file_path: ['resource/uploadDir/test1'],
        region: 'cn-north-6',
        include_self_folder: true
    }
    const obs = getObsClient(inputs);
    await upload.uploadFileOrFolder(obs, inputs);
    const objList = await bucket.listObjects(obs, inputs.bucket_name);
    expect(objList.indexOf('obsTest2/test1/')).toBeGreaterThan(-1);
});

test('upload a exist folder to obs "obsTest3" and include local folder "uploadDir" itself', async () => {
    const inputs = {
        access_key: '******',
        secret_key: '******',
        bucket_name: '******',
        operation_type: 'upload',
        obs_file_path: 'obsTest3',
        local_file_path: ['resource/uploadDir/'],
        region: 'cn-north-6',
        include_self_folder: true
    }
    const obs = getObsClient(inputs);
    await upload.uploadFileOrFolder(obs, inputs);
    const objList = await bucket.listObjects(obs, inputs.bucket_name);
    expect(objList.indexOf('obsTest3/uploadDir/test-mult/other1.txt')).toBeGreaterThan(-1);
});

test('upload a exist folder to obs "obsTest4"', async () => {
    const inputs = {
        access_key: '******',
        secret_key: '******',
        bucket_name: '******',
        operation_type: 'upload',
        obs_file_path: 'obsTest4',
        local_file_path: ['resource/uploadDir/'],
        region: 'cn-north-6'
    }
    const obs = getObsClient(inputs);
    await upload.uploadFileOrFolder(obs, inputs);
    const objList = await bucket.listObjects(obs, inputs.bucket_name);
    expect(objList.indexOf('obsTest4/test-mult/other1.txt')).toBeGreaterThan(-1);
});

test('upload a nonexist folder to obs root ', async () => {
    const inputs = {
        access_key: '******',
        secret_key: '******',
        bucket_name: '******',
        operation_type: 'upload',
        obs_file_path: '',
        local_file_path: ['resource/uploadDir/testabab'],
        region: 'cn-north-6'
    }
    const obs = getObsClient(inputs);
    await upload.uploadFileOrFolder(obs, inputs);
    const objList = await bucket.listObjects(obs, inputs.bucket_name);
    expect(objList.indexOf('testabab/')).toEqual(-1);
});

test('upload a exist folder include lots of files to obs "obsTest5" ', async () => {
    const inputs = {
        access_key: '******',
        secret_key: '******',
        bucket_name: '******',
        operation_type: 'upload',
        obs_file_path: 'obsTest5',
        local_file_path: ['D:/project/spring-boot-main'],
        include_self_folder: true,
        region: 'cn-north-6'
    }
    const obs = getObsClient(inputs);
    await upload.uploadFileOrFolder(obs, inputs);
    const objList = await bucket.listObjects(obs, inputs.bucket_name);
    expect(objList.indexOf('obsTest5/spring-boot-mai/')).toEqual(-1);
});

// ----------------------------------------funciton----------------------------------------

test('fileDisplay', async () => {
    const uploadList = {
        file: [],
        folder: []
    };
    const inputs = {
        access_key: '******',
        secret_key: '******',
        bucket_name: '******',
        operation_type: 'upload',
        obs_file_path: 'obsTest6',
        local_file_path: ['resource/uploadDir'],
        region: 'cn-north-6',   
    };
    await upload.fileDisplay(getObsClient(inputs), inputs, 'resource/uploadDir', '', uploadList);
    expect(uploadList.file.length).toEqual(5);
    expect(uploadList.folder).toEqual(['test', 'test/test2', 'test-mult', 'test-mult/other1', 'test1']);
});

test('getObsRootFile', () => {
    expect(upload.getObsRootFile(true, 'obs', 'local')).toEqual('obs/local');
    expect(upload.getObsRootFile(false, 'obs', 'local')).toEqual('obs');
});

test('uploadFile', async () => {
    const inputs = {
        access_key: '******',
        secret_key: '******',
        bucket_name: '******',
        operation_type: 'upload',
        obs_file_path: 'obsTest6',
        local_file_path: ['resource/uploadDir/file1.txt'],
        region: 'cn-north-6',   
    };
    const obs = getObsClient(inputs);
    await upload.uploadFile(obs, inputs.bucket_name, inputs.local_file_path[0], inputs.obs_file_path);
    const objList = await bucket.listObjects(obs, inputs.bucket_name);
    expect(objList.indexOf('obsTest6/file1.txt') > -1).toBeTruthy;
});

test('uploadFolder', async () => {
    const inputs = {
        access_key: '******',
        secret_key: '******',
        bucket_name: '******',
        operation_type: 'upload',
        obs_file_path: 'obsTest6/emptyFolder1',
        local_file_path: ['resource/uploadDir/file1.txt'],
        region: 'cn-north-6',   
    };
    const obs = getObsClient(inputs);
    await upload.uploadFolder(obs, inputs.bucket_name, inputs.obs_file_path);
    const objList = await bucket.listObjects(obs, inputs.bucket_name);
    expect(objList.indexOf('obsTest6/emptyFolder1') > -1).toBeTruthy;
});

test('obsCreateRootFolder', async () => {
    const inputs = {
        access_key: '******',
        secret_key: '******',
        bucket_name: '******',
        operation_type: 'upload',
        obs_file_path: 'obsTest6/root1/root2/root3',
        local_file_path: ['resource/uploadDir/file1.txt'],
        region: 'cn-north-6',   
    };
    const obs = getObsClient(inputs);
    await upload.obsCreateRootFolder(obs, inputs.bucket_name, inputs.obs_file_path);
    const objList = await bucket.listObjects(obs, inputs.bucket_name);
    expect(objList.indexOf('obsTest6/root1/') > -1).toBeTruthy;
});