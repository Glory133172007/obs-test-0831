import * as core from '@actions/core'
import { Inputs } from './interface'

export function getInputs(): Inputs {
    return {
        accessKey: core.getInput('accessKey', {required: true}),
        secretKey: core.getInput('secretKey', {required: true}),
        bucketName: core.getInput('bucketName', {required: true}),
        operationType: core.getInput('operationType', {required: true}),
        localFilePath: core.getMultilineInput('localFilePath', {required: true}),
        obsFilePath: core.getInput('obsFilePath', {required: true}),
        region: core.getInput('region', {required: true}),
        includeSelfFolder: core.getInput('includeSelfFolder'),
        exclude: core.getMultilineInput('commands')
    }
} 

export function getInputsForTest(): Inputs {
    return {
        accessKey: 'KQC3HCJ7AUISAMRHJ4LI',
        secretKey: 'tMrRMsPdL0TkZyFvlntweH84Nie1h0vKpi5LRcJd',
        bucketName: 'hdn-hcloudtoolkit-devkitgithubaction-obs',
        operationType: 'upload',
        // obsFilePath: 'uploadtest1/',
        // localFilePath: ['resource/bigFile.zip'],
        obsFilePath: 'uploadtest2',
        localFilePath: ['resource/uploadDir'],
        region: 'cn-north-6',
        // includeSelfFolder: 'y',
        exclude: ['uploadDir/test-mult', "uploadDir/test/yasuobao.txt"]
    }
}