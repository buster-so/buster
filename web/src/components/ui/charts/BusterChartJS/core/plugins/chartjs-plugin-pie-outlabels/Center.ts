import type { ArcProps, Point } from 'chart.js'

export default interface Center {
    x: number
    y: number
    arc: ArcProps
    anchor: Point
}
