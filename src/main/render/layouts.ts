import { Position, Resolution, VideoInput } from './types';

interface VideoLayout {
  getVideoInputs(origin: Position, resolution:Resolution): VideoInput[];
}

class Unit implements VideoLayout {
  input:VideoInput;

  constructor(input:VideoInput) {
    this.input = input;
  }

  getVideoInputs(origin: Position, resolution: Resolution): VideoInput[] {
    this.input.position = origin;
    this.input.resolution = resolution;
    return [ this.input ];
  }
}

class Grid2x2 implements VideoLayout {
  tl:VideoLayout;
  tr:VideoLayout;
  bl:VideoLayout;
  br:VideoLayout;

  constructor(tl:VideoLayout, tr:VideoLayout, bl:VideoLayout, br:VideoLayout) {
    this.tl = tl;
    this.tr = tr;
    this.bl = bl;
    this.br = br;
  }

  getVideoInputs(origin: Position, resolution:Resolution): VideoInput[] {
    const halfRes: Resolution = { 'width': resolution.width / 2, 'height': resolution.height / 2 };

    const trOrigin: Position = { 'top': origin.top, 'left': parseInt(origin.left.toString()) + halfRes.width };
    const blOrigin: Position = { 'top': parseInt(origin.top.toString()) + halfRes.height, 'left': origin.left };
    const brOrigin: Position = { 'top': parseInt(origin.top.toString()) + halfRes.height, 'left': parseInt(origin.left.toString()) + halfRes.width };

    return [
      this.tl.getVideoInputs(origin, halfRes),
      this.tr.getVideoInputs(trOrigin, halfRes),
      this.bl.getVideoInputs(blOrigin, halfRes),
      this.br.getVideoInputs(brOrigin, halfRes)
    ].flat(1);
  }
}

export {
  Unit,
  Grid2x2
};
