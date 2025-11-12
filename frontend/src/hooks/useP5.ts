import { useEffect, useRef } from 'react';

export interface P5Instance {
  createCanvas: (width: number, height: number) => void;
  background: (color?: number | string) => void;
  stroke: (color?: number | string) => void;
  strokeWeight: (weight: number) => void;
  noStroke: () => void;
  fill: (color?: number | string) => void;
  noFill: () => void;
  circle: (x: number, y: number, size: number) => void;
  rect: (x: number, y: number, width: number, height: number) => void;
  noise: (x?: number, y?: number, z?: number) => number;
  noiseSeed: (seed: number) => void;
  colorMode: (mode: string, max?: number) => void;
  color: (value: number | string) => any;
  lerpColor: (c1: any, c2: any, amt: number) => any;
  push: () => void;
  pop: () => void;
  translate: (x: number, y: number) => void;
  rotate: (angle: number) => void;
  scale: (x: number, y?: number) => void;
  frameRate: (rate: number) => void;
  width: number;
  height: number;
  frameCount: number;
  mouseX: number;
  mouseY: number;
  windowWidth: number;
  windowHeight: number;
  millis: () => number;
  random: (min?: number, max?: number) => number;
  map: (value: number, start1: number, stop1: number, start2: number, stop2: number) => number;
  dist: (x1: number, y1: number, x2: number, y2: number) => number;
  sqrt: (value: number) => number;
  cos: (angle: number) => number;
  sin: (angle: number) => number;
  atan2: (y: number, x: number) => number;
  floor: (value: number) => number;
  PI: number;
  TWO_PI: number;
  HSB: string;
  RGB: string;
  blendingMode: (mode: string) => void;
  ADD: string;
  normalMaterial: () => void;
  ambientLight: (color: number | string) => void;
  directionalLight: (color: number | string, direction: [number, number, number]) => void;
  pointLight: (color: number | string, position: [number, number, number]) => void;
  lights: () => void;
  noLights: () => void;
  ambientMaterial: (color: number | string) => void;
  specularMaterial: (color: number | string) => void;
  shininess: (shine: number) => void;
  sphere: (radius: number) => void;
  box: (size: number) => void;
  plane: (width: number, height: number) => void;
  torus: (radius: number, tube?: number) => void;
  cone: (radius: number, height: number) => void;
  cylinder: (radius: number, height: number) => void;
  ellipsoid: (radiusX: number, radiusY: number, radiusZ: number) => void;
  texture: (tex: any) => void;
  noTexture: () => void;
  textureMode: (mode: string) => void;
  textureWrap: (wrapX: string, wrapY?: string) => void;
  beginShape: () => void;
  endShape: (mode?: string) => void;
  vertex: (x: number, y: number, z?: number) => void;
  curveVertex: (x: number, y: number, z?: number) => void;
  bezierVertex: (
    x2: number, y2: number, z2: number,
    x3: number, y3: number, z3: number,
    x4: number, y4: number, z4: number
  ) => void;
  curve: (
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    x3: number, y3: number, z3: number,
    x4: number, y4: number, z4: number
  ) => void;
  bezier: (
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number,
    x4: number, y4: number
  ) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  triangle: (
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number
  ) => void;
  quad: (
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number,
    x4: number, y4: number
  ) => void;
  arc: (
    x: number, y: number,
    width: number, height: number,
    start: number, stop: number,
    mode?: string
  ) => void;
  ellipse: (x: number, y: number, width: number, height: number) => void;
  textAlign: (align?: string, alignY?: string) => void;
  textSize: (size: number) => void;
  text: (str: string, x: number, y: number, x2?: number, y2?: number) => void;
  textFont: (font: any) => void;
  textWidth: (str: string) => number;
  textLeading: (leading: number) => void;
  loadFont: (path: string, callback?: (font: any) => void) => any;
  loadImage: (path: string, callback?: (img: any) => void) => any;
  image: (img: any, x: number, y: number, width?: number, height?: number) => void;
  imageMode: (mode: string) => void;
  tint: (color: number | string) => void;
  noTint: () => void;
  filter: (filterType: string, param?: number) => void;
  blendMode: (mode: string) => void;
  erase: (strengthFill?: number, strengthStroke?: number) => void;
  noErase: () => void;
  drawingContext: any;
  cursor: (type?: string | any) => void;
  noCursor: () => void;
  requestPointerLock: () => void;
  exitPointerLock: () => void;
  movePointerLock: () => void;
  pointerLock: () => boolean;
  frameBuffer: any;
  pixels: any[];
  loadPixels: () => void;
  updatePixels: () => void;
  get: (x: number, y: number, w?: number, h?: number) => any;
  set: (x: number, y: number, c: any) => void;
  clear: () => void;
  resetMatrix: () => void;
  applyMatrix: (...args: number[]) => void;
  shearX: (angle: number) => void;
  shearY: (angle: number) => void;
  redo: () => void;
  undo: () => void;
  save: (filename?: string) => void;
  saveCanvas: (filename: string, extension: string) => void;
  loadJSON: (path: string, callback?: (data: any) => void) => any;
  loadStrings: (path: string, callback?: (strings: string[]) => void) => any;
  loadTable: (path: string, callback?: (table: any) => void) => any;
  loadXML: (path: string, callback?: (xml: any) => void) => any;
  httpGet: (path: string, callback?: (data: any) => void) => void;
  httpPost: (path: string, data: any, callback?: (response: any) => void) => void;
  httpDo: (path: string, method: string, data: any, callback?: (response: any) => void) => void;
  createWriter: (name: string) => any;
  createInput: (value?: string, type?: string) => any;
  createSlider: (min: number, max: number, value?: number, step?: number) => any;
  createButton: (label: string) => any;
  createCheckbox: (label?: string, value?: boolean) => any;
  createSelect: (multiple?: boolean) => any;
  createRadio: (name: string) => any;
  createColorPicker: (value?: string) => any;
  createInput: (value?: string) => any;
  createFileInput: (callback: (file: any) => void) => any;
  createVideo: (src: string | string[], callback?: () => void) => any;
  createAudio: (src: string | string[], callback?: () => void) => any;
  createCapture: (type: string | any, callback?: () => void) => any;
  createElement: (tag: string, content?: string) => any;
  select: (selector: string) => any;
  selectAll: (selector: string) => any;
  removeElements: () => void;
  changed: (callback: (value: any) => void) => void;
  input: (callback: (value: any) => void) => void;
  createDiv: (html?: string) => any;
  createP: (html?: string) => any;
  createSpan: (html?: string) => any;
  createImg: (src: string, alt?: string) => any;
  createA: (href: string, html?: string, target?: string) => any;
  createHeading: (level: number, content?: string) => any;
  createParagraph: (content?: string) => any;
  createCanvas: (width: number, height: number, renderer?: string) => any;
  createGraphics: (width: number, height: number, renderer?: string) => any;
  createStringDict: (key?: string, value?: string) => any;
  createNumberDict: (key?: string, value?: number) => any;
  createVector: (x?: number, y?: number, z?: number) => any;
  randomGaussian: (mean?: number, sd?: number) => number;
  randomSeed: (seed: number) => void;
  noiseDetail: (lod?: number, falloff?: number) => void;
  randomChoice: (choices: any[]) => any;
  randomize: (choices: any[]) => void;
  nf: (num: number, digits?: number) => string;
  nfc: (num: number, digits?: number) => string;
  nfp: (num: number, digits?: number) => string;
  nfs: (num: number, digits?: number) => string;
  int: (n: number | string) => number;
  float: (n: number | string) => number;
  str: (n: number) => string;
  boolean: (value: any) => boolean;
  byte: (value: number) => number;
  char: (value: number) => string;
  unchar: (value: string) => number;
  hex: (value: number, digits?: number) => string;
  unhex: (value: string) => number;
  binary: (value: number, digits?: number) => string;
  unbinary: (value: string) => number;
  matchAll: (str: string, regexp: RegExp) => RegExpMatchArray[];
  match: (str: string, regexp: RegExp) => RegExpMatchArray | null;
  day: () => number;
  hour: () => number;
  minute: () => number;
  second: () => number;
  millis: () => number;
  year: () => number;
  month: () => number;
  online: () => boolean;
  touches: any[];
  touchesLength: number;
  touchIsStarted: boolean;
  touchIsMoved: boolean;
  touchIsEnded: boolean;
  touchStarted: (callback?: (x: number, y: number) => void) => void;
  touchMoved: (callback?: (x: number, y: number) => void) => void;
  touchEnded: (callback?: (x: number, y: number) => void) => void;
  keyIsPressed: boolean;
  key: string;
  keyCode: number;
  keyPressed: (callback?: (key: string, keyCode: number) => void) => void;
  keyReleased: (callback?: (key: string, keyCode: number) => void) => void;
  keyTyped: (callback?: (key: string, keyCode: number) => void) => void;
  mouseIsPressed: boolean;
  mouseButton: string;
  mousePressed: (callback?: (x: number, y: number, button: number) => void) => void;
  mouseReleased: (callback?: (x: number, y: number, button: number) => void) => void;
  mouseMoved: (callback?: (x: number, y: number) => void) => void;
  mouseDragged: (callback?: (x: number, y: number, button: number) => void) => void;
  doubleClicked: (callback?: (x: number, y: number, button: number) => void) => void;
  mouseWheel: (callback?: (deltaX: number, deltaY: number) => void) => void;
  deviceMoved: (callback?: (ax: number, ay: number, az: number) => void) => void;
  deviceTurned: (callback?: (ax: number, ay: number, az: number) => void) => void;
  deviceShaken: (callback?: (ax: number, ay: number, az: number) => void) => void;
  windowResized: (callback?: (width: number, height: number) => void) => void;
  fullscreen: (val?: boolean) => void;
  pixelDensity: (val?: number) => number;
  displayDensity: (val?: number) => number;
  getURL: () => string;
  getURLParams: () => any;
  getURLPath: () => string[];
  preload: (callback?: () => void) => void;
  setup: (callback?: () => void) => void;
  draw: (callback?: () => void) => void;
  noLoop: () => void;
  loop: () => void;
  isLooping: () => boolean;
  push: () => void;
  pop: () => void;
  redraw: () => void;
  remove: () => void;
  clear: () => void;
  registerMethod: (name: string, callback: () => void) => void;
  unregisterMethod: (name: string, callback: () => void) => void;
  exit: () => void;
}

export interface UseP5Options {
  setup?: (p5: P5Instance, canvasContainer: Element) => void;
  draw?: (p5: P5Instance) => void;
  windowResized?: (p5: P5Instance) => void;
  preload?: () => void;
  mousePressed?: (p5: P5Instance) => void;
  mouseReleased?: (p5: P5Instance) => void;
  mouseMoved?: (p5: P5Instance) => void;
  keyPressed?: (p5: P5Instance) => void;
  keyReleased?: (p5: P5Instance) => void;
}

export const useP5 = (options: UseP5Options = {}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<P5Instance | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const loadP5 = async () => {
      try {
        // Dynamically import p5 to avoid SSR issues
        const p5Module = await import('p5');
        const p5Constructor = p5Module.default;

        const sketch = (p5: any) => {
          // Store p5 instance
          p5InstanceRef.current = p5 as P5Instance;

          // Preload function
          if (options.preload) {
            p5.preload = options.preload;
          }

          // Setup function
          p5.setup = () => {
            if (options.setup) {
              options.setup(p5 as P5Instance, canvasRef.current!);
            }
          };

          // Draw function
          p5.draw = () => {
            if (options.draw) {
              options.draw(p5 as P5Instance);
            }
          };

          // Window resize function
          if (options.windowResized) {
            p5.windowResized = () => {
              options.windowResized!(p5 as P5Instance);
            };
          }

          // Mouse events
          if (options.mousePressed) {
            p5.mousePressed = () => {
              options.mousePressed!(p5 as P5Instance);
            };
          }

          if (options.mouseReleased) {
            p5.mouseReleased = () => {
              options.mouseReleased!(p5 as P5Instance);
            };
          }

          if (options.mouseMoved) {
            p5.mouseMoved = () => {
              options.mouseMoved!(p5 as P5Instance);
            };
          }

          // Keyboard events
          if (options.keyPressed) {
            p5.keyPressed = () => {
              options.keyPressed!(p5 as P5Instance);
            };
          }

          if (options.keyReleased) {
            p5.keyReleased = () => {
              options.keyReleased!(p5 as P5Instance);
            };
          }
        };

        // Create p5 instance
        new p5Constructor(sketch, canvasRef.current);
      } catch (error) {
        console.error('Error loading p5:', error);
      }
    };

    loadP5();

    return () => {
      // Cleanup p5 instance if it exists
      if (p5InstanceRef.current) {
        try {
          // p5 doesn't have a direct cleanup method, but we can remove the canvas
          const canvas = canvasRef.current?.querySelector('canvas');
          if (canvas) {
            canvas.remove();
          }
        } catch (error) {
          console.error('Error cleaning up p5:', error);
        }
      }
    };
  }, []);

  return {
    canvasRef,
    p5Instance: p5InstanceRef.current
  };
};