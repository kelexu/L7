
import Tile from './tile';
import ImageBuffer from '../../geom/buffer/image';
import DrawImage from '../render/image/drawImage';
export default class ImageTile extends Tile {
  requestTileAsync() {
    // Making this asynchronous really speeds up the LOD framerate
    setTimeout(() => {
      if (!this._mesh) {
        // this._mesh = this._createMesh();
        this._requestTile();
      }
    }, 0);
  }
  _requestTile() {
    const image = this._createDebugMesh();
    this._createMesh(image);
    this.emit('tileLoaded');
    // const urlParams = {
    //   x: this._tile[0],
    //   y: this._tile[1],
    //   z: this._tile[2]
    // };

    // const url = this._getTileURL(urlParams);
    // const image = document.createElement('img');

    // image.addEventListener('load', () => {
    //   this._isLoaded = true;
    //   this._createMesh(image);
    //   this.emit('tileLoaded');
    //   this._ready = true;
    // }, false);

    // image.crossOrigin = '';

    // // Load image
    // image.src = url;

    // this._image = image;
  }
  _getBufferData(images) {
    const NW = this._tileBounds.getTopLeft();
    const SE = this._tileBounds.getBottomRight();
    const coordinates = [[ NW.x, NW.y, 0 ], [ SE.x, SE.y, 0 ]];
    return [{
      coordinates,
      images
    }];
  }
  _createMesh(image) {
    if (!this._center) {
      return;
    }
    this._layerData = this._getBufferData(image);
    const buffer = new ImageBuffer({
      layerData: this._layerData
    });
    buffer.attributes.texture = buffer.texture;
    const style = this.layer.get('styleOptions');
    const mesh = DrawImage(buffer.attributes, style);
    this._object3D.add(mesh);
    return this._object3D;
  }
  _createDebugMesh() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 256;
    context.font = 'Bold 20px Helvetica Neue, Verdana, Arial';
    context.fillStyle = '#ff0000';
    context.fillText(this._tile.join('/'), 20, 20);
    context.strokeStyle = 'red';
    context.rect(0, 0, 256, 256);
    context.stroke();
    return canvas;
  }
  _abortRequest() {
    if (!this._image) {
      return;
    }

    this._image.src = '';
  }
  updateColor() {

  }
  getSelectFeature() {
    return {};
  }
  destroy() {
    // Cancel any pending requests
    this._abortRequest();

    // Clear image reference
    this._image = null;

    super.destroy();
  }

}
