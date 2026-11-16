declare module 'kanji-recognizer' {
  interface Point {
    x: number;
    y: number;
  }
  export class GeometryUtil {
    static resample(points: Point[], count?: number): Point[];
    static getPathLength(points: Point[]): number;
    static compareStrokes(
      user: Point[],
      target: Point[],
      options?: {
        startDistThreshold?: number;
        translationWeight?: number;
        shapeWeight?: number;
      },
    ): number;
  }
}
