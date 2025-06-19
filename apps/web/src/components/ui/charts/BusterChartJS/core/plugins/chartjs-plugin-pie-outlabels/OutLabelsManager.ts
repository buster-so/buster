import type { Chart } from 'chart.js';
import type OutLabel from './OutLabel';

export default class OutLabelsManager {
  renderedAt = 0;
  animateStarted = false;
  animateCompleted = false;
  isCancelled = false;
  labels: Map<string, Map<number, OutLabel>> = new Map();
  usedShrink?: boolean = false;

  set(id: string): void {
    this.labels.set(id, new Map());
  }

  get(id: string): Map<number, OutLabel> | undefined {
    return this.labels.get(id);
  }

  setCancelled(isCancelled: boolean): void {
    this.isCancelled = isCancelled;
  }

  setLabel(id: string, number: number, label: OutLabel): void {
    const labels = this.get(id);
    if (!labels) return;

    labels?.set(number, label);
  }

  removeLabel(id: string, number: number): void {
    const labels = this.get(id);
    if (!labels) return;

    labels.delete(number);
  }

  private adjustQuadrant(list: OutLabel[]): boolean {
    if (list.length < 2) {
      return false;
    }

    list.sort((i1, i2) => i1.rect.y - i2.rect.y);

    let lastPos = 0;
    let adjusted = false;
    const shifts = [];
    let totalShifts = 0;

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const rect = item.rect;
      const delta = rect.y - lastPos;
      if (delta < 0) {
        rect.y -= delta;
        item.y -= delta;
        adjusted = true;
      }
      const shift = Math.max(-delta, 0);
      shifts.push(shift);
      totalShifts += shift;

      lastPos = rect.y + item.rect.height;
    }

    if (totalShifts > 0) {
      // Shift back to make the distribution more equally.
      const delta = -totalShifts / list.length;
      if (delta !== 0) adjusted = true;

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        const rect = item.rect;
        rect.y += delta;
        item.rect.y += delta;
      }
    }

    return adjusted;
  }

  private recalculateX(chart: Chart<'doughnut' | 'pie'>, list: OutLabel[]) {
    if (list.length < 1) return;

    const cx = (chart.chartArea.left + chart.chartArea.right) / 2;
    const cy = (chart.chartArea.top + chart.chartArea.bottom) / 2;
    const r = list[0].arc.outerRadius;
    const dir = list[0].nx < 0 ? -1 : 1;

    let maxY = 0;
    let rB = 0;

    for (const item of list) {
      const dy = Math.abs(item.rect.y - cy);
      if (dy > maxY) {
        const dx = item.rect.x - cx;
        const rA = r + item.style.length;
        rB = Math.abs(dx) < rA ? Math.sqrt((dy * dy) / (1 - (dx * dx) / rA / rA)) : rA;
        maxY = dy;
      }
    }

    const rB2 = rB * rB;
    for (const item of list) {
      const dy = Math.abs(item.rect.y - cy);
      // horizontal r is always same with original r because x is not changed.
      const rA = r + item.style.length;
      const rA2 = rA * rA;
      // Use ellipse implicit function to calculate x
      const dx = Math.sqrt((1 - Math.abs((dy * dy) / rB2)) * rA2);
      const newX = cx + dx * dir;

      item.x = newX;
    }
  }

  private isLabelWithinChartBounds(chart: Chart<'doughnut' | 'pie'>, label: OutLabel): boolean {
    const chartArea = chart.chartArea;
    const rect = label.rect;

    // Add some padding to avoid labels touching the edge
    const padding = 2;

    return (
      rect.x >= chartArea.left - padding &&
      rect.x + rect.width <= chartArea.right + padding &&
      rect.y >= chartArea.top - padding &&
      rect.y + rect.height <= chartArea.bottom + padding
    );
  }

  avoidOverlap(chart: Chart<'doughnut' | 'pie'>): void {
    const labels = this.get(chart.id);
    if (labels) {
      const cx = (chart.chartArea.left + chart.chartArea.right) / 2;
      const cy = (chart.chartArea.top + chart.chartArea.bottom) / 2;

      const topLeftList: OutLabel[] = [];
      const topRightList: OutLabel[] = [];
      const bottomLeftList: OutLabel[] = [];
      const bottomRightList: OutLabel[] = [];

      for (const item of labels.values()) {
        // Reset display in case it was previously hidden
        item.style.display = true;

        if (item.x < cx) {
          if (item.y < cy) topLeftList.push(item);
          else bottomLeftList.push(item);
        } else {
          if (item.y < cy) topRightList.push(item);
          else bottomRightList.push(item);
        }
      }

      if (this.adjustQuadrant(topLeftList)) this.recalculateX(chart, topLeftList);
      if (this.adjustQuadrant(topRightList)) this.recalculateX(chart, topRightList);
      if (this.adjustQuadrant(bottomLeftList)) this.recalculateX(chart, bottomLeftList);
      if (this.adjustQuadrant(bottomRightList)) this.recalculateX(chart, bottomRightList);

      // Only check bounds after animation is complete
      if (this.animateCompleted) {
        for (const item of labels.values()) {
          if (!this.isLabelWithinChartBounds(chart, item)) {
            item.style.display = false;
          }
        }
      }
    }
  }

  setRenderedAt(): void {
    this.renderedAt = performance.now();
  }

  setAnimateStarted(): void {
    this.animateStarted = true;
  }

  setAnimateCompleted(): void {
    this.animateCompleted = true;
  }

  setUsedShrink(usedShrink: boolean): void {
    this.usedShrink = usedShrink;
  }
}
