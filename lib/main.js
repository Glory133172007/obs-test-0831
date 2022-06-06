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
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const commonInputs = context.getCommonInputs();
        if (!utils.checkCommonInputs(commonInputs)) {
            return;
        }
        // 初始化OBS客户端
        const obs = context.getObsClient(commonInputs.accessKey, commonInputs.secretKey, `https://obs.${commonInputs.region}.myhuaweicloud.com`);
        const operationCategory = utils.getOperationCategory(context.getOperationType());
        // 对象操作
        if (operationCategory === 'object') {
            const inputs = context.getObjectInputs();
            if (!utils.checkObjectInputs(inputs)) {
                return;
            }
            // 若桶不存在，退出
            if (!(yield bucket.hasBucket(obs, inputs.bucketName))) {
                core.setFailed(`The bucket: ${inputs.bucketName} does not exists.`);
                return;
            }
            // 执行上传/下载操作
            if (inputs.operationType === 'upload') {
                yield upload.uploadFileOrFolder(obs, inputs);
            }
            if (inputs.operationType === 'download') {
                yield download.downloadFileOrFolder(obs, inputs);
            }
        }
        else if (operationCategory === 'bucket') {
            const inputs = context.getBucketInputs();
            // 检查桶输入
            if (!utils.checkBucketInputs(inputs)) {
                return;
            }
            const isBucketExist = yield bucket.hasBucket(obs, inputs.bucketName);
            if (inputs.operationType.toLowerCase() === 'createbucket') {
                // 若桶已经存在，退出
                if (isBucketExist) {
                    core.setFailed(`The bucket: ${inputs.bucketName} already exists.`);
                    return;
                }
                bucket.createBucket(obs, inputs.bucketName, inputs.region, (_a = inputs.publicRead) !== null && _a !== void 0 ? _a : false, utils.getStorageClass((_b = inputs.storageClass) !== null && _b !== void 0 ? _b : ''));
            }
            if (inputs.operationType.toLowerCase() === 'deletebucket') {
                // 若桶不存在，退出
                if (!isBucketExist) {
                    core.setFailed(`The bucket: ${inputs.bucketName} does not exists.`);
                    return;
                }
                const isEmpty = yield bucket.isBucketEmpty(obs, inputs.bucketName);
                if (!isEmpty && inputs.clearBucket === false) {
                    core.setFailed('some object or parts already exist in bucket, please delete them first or not set parameter "clear_bucket" as false.');
                    return;
                }
                yield bucket.deleteBucket(obs, inputs.bucketName, isEmpty);
            }
        }
        else {
            core.setFailed(`please check your operation_type. you can use 'download', 'upload', 'createbucket' or 'deletebucket'.`);
        }
    });
}
run();
