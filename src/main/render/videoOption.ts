import { VideoOption } from './types';


class VideoInputOption implements VideoOption{
  file: string;
  brightness_enable: boolean;
  brightness: number;
  contrast_enable: boolean;
  contrast: number;
  balance_enable: boolean;
  r_balance: number;
  g_balance: number;
  b_balance: number;
  blur_enable: boolean;
  blur_radius: number;

  constructor(
    file: string,
    brightness_enable: boolean,
    brightness: number, //from -1.0 to 1.0, default = 0
    contrast_enable: boolean,
    contrast: number, //from -1000 to 1000, default = 0
    balance_enable: boolean,
    r_balance: number, //from 0.1 to 10, default = 1.0
    g_balance: number,
    b_balance: number,
    blur_enable: boolean,
    blur_radius: number  //manually defined from 0.1 to 50, to limit the effect
  ){
    this.file = file;
    this.brightness_enable = brightness_enable;
    this.brightness = Math.min(1, Math.max(brightness, -1));
    this.contrast_enable = contrast_enable;
    this.contrast = Math.min(1000, Math.max(contrast, -1000));
    this.balance_enable = balance_enable;
    this.r_balance = Math.min(10, Math.max(r_balance, 0.1));
    this.g_balance = Math.min(10, Math.max(g_balance, 0.1));
    this.b_balance = Math.min(10, Math.max(b_balance, 0.1));
    this.blur_enable = blur_enable;
    this.blur_radius = blur_radius;
  }

  //order of applying: eq -> blur
  getEqArgs(): string{
    //eq will be applied anyway
    return `eq=${
      this.contrast_enable ? this.contrast.toString() : '1'  }:${
      this.brightness_enable ? this.brightness.toString() : '0'  }:`
            + '1.0:'  //saturation
            + `1.0:${  //gamma
              + (this.balance_enable ? this.r_balance.toString() : '1.0')  }:${
              this.balance_enable ? this.g_balance.toString() : '1.0'  }:${
              this.balance_enable ? this.b_balance.toString() : '1.0'  }:`
            + '1.0,'; //gama weight
  }

  getBlurArgs(): string{
    return this.blur_enable ? `avgblur=${  this.blur_radius  },` : '';
  }

  getAllOptions(): string{
    return this.getEqArgs() + this.getBlurArgs();
  }
}

let optionMap: Map<string, VideoInputOption>|undefined;

function getVideoOptionMap(): Map<string, VideoInputOption>{
  if (optionMap === undefined){
    optionMap = new Map<string, VideoInputOption>();
  }
  return optionMap;
}

function addVideoOption(option: VideoOption): void{
  if (optionMap === undefined){
    optionMap = new Map<string, VideoInputOption>();
  }
  optionMap.set(
    option.file,
    new VideoInputOption(
      option.file,
      option.brightness_enable,
      option.brightness,
      option.contrast_enable,
      option.contrast,
      option.balance_enable,
      option.r_balance,
      option.g_balance,
      option.b_balance,
      option.blur_enable,
      option.blur_radius
    )
  );
}

export {
  addVideoOption,
  getVideoOptionMap,
  VideoInputOption
};
