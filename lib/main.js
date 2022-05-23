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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const context = __importStar(require("./context"));
const upload = __importStar(require("./upload"));
const download = __importStar(require("./download"));
const bucket = __importStar(require("./bucket"));
const utils = __importStar(require("./utils"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
        // 对象操作
        if (utils.getOperationType(context.getOperationType()) === 'object') {
            const inputs = context.getObjectInputs();
            if (!utils.checkObjectInputs(inputs)) {
                core.setFailed('input parameters is not correct.');
                return;
            }
            // 初始化OBS客户端
            const obs = context.getObsClient(inputs.access_key, inputs.secret_key, `https://obs.${inputs.region}.myhuaweicloud.com`);
            // 若桶不存在，退出
            if (!(yield bucket.hasBucket(obs, inputs.bucket_name))) {
                core.setFailed('bucket not exist.');
                return;
            }
            // 执行上传/下载操作
            if (inputs.operation_type === 'upload') {
                yield upload.uploadFileOrFolder(obs, inputs);
            }
            else if (inputs.operation_type === 'download') {
                yield download.downloadFileOrFolder(obs, inputs);
            }
            else {
                core.setFailed('operation type error, you should input "upload" or "download"');
            }
        }
        else if (utils.getOperationType(context.getOperationType()) === 'bucket') {
            const inputs = context.getBucketInputs();
            // 检查桶输入
            if (!utils.checkBucketInputs(inputs)) {
                core.setFailed('input parameters is not correct.');
                return;
            }
            // 初始化OBS客户端
            const obs = context.getObsClient(inputs.access_key, inputs.secret_key, `https://obs.${inputs.location}.myhuaweicloud.com`);
            if (inputs.operation_type.toLowerCase() === 'createbucket') {
                // 若桶已经存在，退出
                if (yield bucket.hasBucket(obs, inputs.bucket_name)) {
                    core.setFailed('bucket already exist.');
                    return;
                }
                yield bucket.createBucket(obs, inputs.bucket_name, inputs.location, inputs.ACL, inputs.storage_class);
            }
            else if (inputs.operation_type.toLowerCase() === 'deletebucket') {
                const isEmpty = yield bucket.isBucketEmpty(obs, inputs.bucket_name);
                if (!isEmpty && !inputs.clear_bucket) {
                    core.setFailed('please clear all objects and parts in the bucket before delete it, you can set "clear_bucket" as true to allow us clear the bucket.');
                    return;
                }
                yield bucket.deleteBucket(obs, inputs.bucket_name, isEmpty);
            }
            else {
                core.setFailed('operation type error, you should input "createBucket" or "deleteBucket"');
                return;
            }
        }
        else {
            core.setFailed(`please check your operation_type.`);
        }
    });
}
run();
