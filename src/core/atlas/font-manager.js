import TinySDF from '@mapbox/tiny-sdf';
import { buildMapping } from '../../util/font-util';
import * as THREE from '../three';
import LRUCache from '../../util/lru-cache';
export const DEFAULT_CHAR_SET = getDefaultCharacterSet();
export const DEFAULT_FONT_FAMILY = 'sans-serif';
export const DEFAULT_FONT_WEIGHT = 'normal';
export const DEFAULT_FONT_SIZE = 24;
export const DEFAULT_BUFFER = 3;
export const DEFAULT_CUTOFF = 0.25;
export const DEFAULT_RADIUS = 8;
const MAX_CANVAS_WIDTH = 1024;
const BASELINE_SCALE = 1.0;
const HEIGHT_SCALE = 1.0;
const CACHE_LIMIT = 3;
const cache = new LRUCache(CACHE_LIMIT);

const VALID_PROPS = [
  'fontFamily',
  'fontWeight',
  'characterSet',
  'fontSize',
  'sdf',
  'buffer',
  'cutoff',
  'radius'
];

function getDefaultCharacterSet() {
  const charSet = [];
  for (let i = 32; i < 128; i++) {
    charSet.push(String.fromCharCode(i));
  }
  return charSet;
}

function setTextStyle(ctx, fontFamily, fontSize, fontWeight) {
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = 'black';
  ctx.textBaseline = 'middle';
  // ctx.textAlign = 'left';
}
function getNewChars(key, characterSet) {
  const cachedFontAtlas = cache.get(key);
  if (!cachedFontAtlas) {
    return characterSet;
  }

  const newChars = [];
  const cachedMapping = cachedFontAtlas.mapping;
  let cachedCharSet = Object.keys(cachedMapping);
  cachedCharSet = new Set(cachedCharSet);

  let charSet = characterSet;
  if (charSet instanceof Array) {
    charSet = new Set(charSet);
  }

  charSet.forEach(char => {
    if (!cachedCharSet.has(char)) {
      newChars.push(char);
    }
  });

  return newChars;
}

function populateAlphaChannel(alphaChannel, imageData) {
  // populate distance value from tinySDF to image alpha channel
  for (let i = 0; i < alphaChannel.length; i++) {
    imageData.data[4 * i + 3] = alphaChannel[i];
  }
}

export default class FontAtlasManager {
  constructor() {

    // font settings
    this.props = {
      fontFamily: DEFAULT_FONT_FAMILY,
      fontWeight: DEFAULT_FONT_WEIGHT,
      characterSet: DEFAULT_CHAR_SET,
      fontSize: DEFAULT_FONT_SIZE,
      buffer: DEFAULT_BUFFER,
      // sdf only props
      // https://github.com/mapbox/tiny-sdf
      sdf: true,
      cutoff: DEFAULT_CUTOFF,
      radius: DEFAULT_RADIUS
    };

    // key is used for caching generated fontAtlas
    this._key = null;
    this._texture = new THREE.Texture();
  }

  get texture() {
    return this._texture;
  }

  get mapping() {
    const data = cache.get(this._key);
    return data && data.mapping;
  }

  get scale() {
    return HEIGHT_SCALE;
  }

  get fontAtlas() {
    return this._fontAtlas;
  }

  setProps(props = {}) {
    VALID_PROPS.forEach(prop => {
      if (prop in props) {
        this.props[prop] = props[prop];
      }
    });

    // update cache key
    const oldKey = this._key;
    this._key = this._getKey();

    const charSet = getNewChars(this._key, this.props.characterSet);
    const cachedFontAtlas = cache.get(this._key);

    // if a fontAtlas associated with the new settings is cached and
    // there are no new chars
    if (cachedFontAtlas && charSet.length === 0) {
      // update texture with cached fontAtlas
      if (this._key !== oldKey) {
        this._updateTexture(cachedFontAtlas);
      }
      return;
    }

    // update fontAtlas with new settings
    const fontAtlas = this._generateFontAtlas(this._key, charSet, cachedFontAtlas);
    this._fontAtlas = fontAtlas;
    this._updateTexture(fontAtlas);

    // update cache
    cache.set(this._key, fontAtlas);
  }

  _updateTexture({ data: canvas }) {
    this._texture = new THREE.CanvasTexture(canvas);
    this._texture.minFilter = THREE.LinearFilter;
    this._texture.magFilter = THREE.LinearFilter;
    this._texture.flipY = false;
    this._texture.format = THREE.AlphaFormat;
    this._texture.needUpdate = true;
  }

  _generateFontAtlas(key, characterSet, cachedFontAtlas) {
    const { fontFamily, fontWeight, fontSize, buffer, sdf, radius, cutoff } = this.props;
    let canvas = cachedFontAtlas && cachedFontAtlas.data;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = MAX_CANVAS_WIDTH;
    }
    const ctx = canvas.getContext('2d');

    setTextStyle(ctx, fontFamily, fontSize, fontWeight);

    // 1. build mapping
    const { mapping, canvasHeight, xOffset, yOffset } = buildMapping(
      Object.assign(
        {
          getFontWidth: char => ctx.measureText(char).width,
          fontHeight: fontSize * HEIGHT_SCALE,
          buffer,
          characterSet,
          maxCanvasWidth: MAX_CANVAS_WIDTH
        },
        cachedFontAtlas && {
          mapping: cachedFontAtlas.mapping,
          xOffset: cachedFontAtlas.xOffset,
          yOffset: cachedFontAtlas.yOffset
        }
      )
    );

    // 2. update canvas
    // copy old canvas data to new canvas only when height changed
    if (canvas.height !== canvasHeight) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.height = canvasHeight;
      ctx.putImageData(imageData, 0, 0);
    }
    setTextStyle(ctx, fontFamily, fontSize, fontWeight);

    // 3. layout characters
    if (sdf) {
      const tinySDF = new TinySDF(fontSize, buffer, radius, cutoff, fontFamily, fontWeight);
      // used to store distance values from tinySDF
      // tinySDF.size equals `fontSize + buffer * 2`
      const imageData = ctx.getImageData(0, 0, tinySDF.size, tinySDF.size);

      for (const char of characterSet) {
        populateAlphaChannel(tinySDF.draw(char), imageData);
        // 考虑到描边，需要保留 sdf 的 buffer，不能像 deck.gl 一样直接减去
        ctx.putImageData(imageData, mapping[char].x, mapping[char].y);
      }
    } else {
      for (const char of characterSet) {
        ctx.fillText(char, mapping[char].x, mapping[char].y + fontSize * BASELINE_SCALE);
      }
    }
    return {
      xOffset,
      yOffset,
      mapping,
      data: canvas,
      width: canvas.width,
      height: canvas.height
    };
  }

  _getKey() {
    const { fontFamily, fontWeight, fontSize, buffer, sdf, radius, cutoff } = this.props;
    if (sdf) {
      return `${fontFamily} ${fontWeight} ${fontSize} ${buffer} ${radius} ${cutoff}`;
    }
    return `${fontFamily} ${fontWeight} ${fontSize} ${buffer}`;
  }
}
