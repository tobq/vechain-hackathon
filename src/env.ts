import {getRequiredEnvVar, getRequiredEnvVarNumber} from "./utils";

export const stemsModelId = getRequiredEnvVarNumber("SPLIT_MODEL_ID");
export const upscalerModelId = getRequiredEnvVarNumber("UPSCALER_MODEL_ID");
export const souncloudClientId = getRequiredEnvVar("SOUNDCLOUD_CLIENT_ID");
export const jamStudioTutorialVideoId = getRequiredEnvVar("JAM_TUTORIAL_VIDEO_ID");