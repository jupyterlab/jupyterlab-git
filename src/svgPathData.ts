// a canvas like api for building an svg path data attribute
export class SVGPathData {
  constructor() {
    this._SVGPath = [];
  }
  toString(): string {
    return this._SVGPath.join(' ');
  }
  moveTo(x: number, y: number): void {
    this._SVGPath.push(`M ${x},${y}`);
  }
  lineTo(x: number, y: number): void {
    this._SVGPath.push(`L ${x},${y}`);
  }
  closePath(): void {
    this._SVGPath.push('Z');
  }
  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void {
    this._SVGPath.push(`C ${cp1x}, ${cp1y}, ${cp2x}, ${cp2y}, ${x}, ${y}`);
  }

  private _SVGPath: string[];
}
