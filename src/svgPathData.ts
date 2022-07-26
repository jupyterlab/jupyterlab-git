// a canvas like api for building an svg path data attribute
export class SVGPathData {
  constructor() {
    this.commands = [];
  }
  toString(): string {
    return this.commands.join(' ');
  }
  moveTo(x: number, y: number): void {
    this.commands.push(`M ${x},${y}`);
  }
  lineTo(x: number, y: number): void {
    this.commands.push(`L ${x},${y}`);
  }
  closePath(): void {
    this.commands.push('Z');
  }
  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void {
    this.commands.push(`C ${cp1x}, ${cp1y}, ${cp2x}, ${cp2y}, ${x}, ${y}`);
  }

  commands: string[];
}
