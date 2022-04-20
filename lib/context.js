"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInputsForTest = exports.getInputs = void 0;
const core = __importStar(require("@actions/core"));
function getInputs() {
    return {
        accessKey: core.getInput('accessKey', { required: true }),
        secretKey: core.getInput('secretKey', { required: true }),
        bucketName: core.getInput('bucketName', { required: true }),
        operationType: core.getInput('operationType', { required: true }),
        localFilePath: core.getMultilineInput('localFilePath', { required: true }),
        obsFilePath: core.getInput('obsFilePath', { required: true }),
        region: core.getInput('region', { required: true }),
        includeSelfFolder: core.getInput('includeSelfFolder'),
        exclude: core.getMultilineInput('commands')
    };
}
exports.getInputs = getInputs;
function getInputsForTest() {
    return {
        accessKey: '******',
        secretKey: '******',
        bucketName: 'hdn-hcloudtoolkit-devkitgithubaction-obs',
        operationType: 'upload',
        obsFilePath: 'uploadtest2',
        localFilePath: ['resource/uploadDir'],
        region: 'cn-north-6'
    };
}
exports.getInputsForTest = getInputsForTest;
