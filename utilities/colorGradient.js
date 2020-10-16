import { Color } from 'three'

export class ColorGradient extends Color {
  constructor(colorList, loop = false, indexList = null) {
    super(colorList[0])
    this._colors = colorList // works with hex representation
    this._loop = loop // if true, colors[colors.length -1] will mix into colors[0] between indices[colors.length - 1] and 1.0.
    // Otherwise, the color will stay at colors[colors.length -1] from indices[colors.length - 1] to 1.0.
    this._indices = indexList // indices[i] is the point at which the color value is exactly colors[i] between 0 and 1
    // if indexList is not defined, use equal indices between the colors
    // how to get the inverse of the index list?
    this._mix1 = new Color()
    this._mix2 = new Color()
  }

  update(pt) {
    const hi = this.indices.findIndex(el => el > pt) // Will this work for the last index?
    const lo = hi - 1
  }
}
