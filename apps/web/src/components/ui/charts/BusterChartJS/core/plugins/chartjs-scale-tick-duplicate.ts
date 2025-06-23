import { type ChartType, TimeScale } from 'chart.js';

declare module 'chart.js' {
  // Add interface extension for TimeScale
  interface TimeScale {
    _unit:
      | 'millisecond'
      | 'second'
      | 'minute'
      | 'hour'
      | 'day'
      | 'week'
      | 'month'
      | 'year'
      | 'quarter';
    _adapter: {
      format(time: unknown, format: string): string;
    };
  }
}

// const originalBuildTicks = TimeScale.prototype.buildTicks;

// // // // Override buildTicks
// TimeScale.prototype.buildTicks = function () {
//   // Generate default ticks
//   const defaultTicks = originalBuildTicks.call(this);

//   // Access tick callback and display format
//   const tickCallback = this.options.ticks?.callback;
//   const displayFormat =
//     this.options.time?.displayFormats?.[this._unit] ||
//     this.options.time?.displayFormats?.month ||
//     'MMM';
//   const format = this._adapter.format.bind(this._adapter);

//   // Deduplicate ticks
//   const seen = new Set();
//   const uniqueTicks = [];

//   for (let i = 0; i < defaultTicks.length; i++) {
//     const tick = defaultTicks[i];
//     let label = tickCallback
//       ? tickCallback.call(this, tick.value, i, defaultTicks)
//       : format(tick.value, displayFormat);
//     const stringLabel = String(label ?? '');

//     if (!seen.has(stringLabel)) {
//       seen.add(stringLabel);
//       uniqueTicks.push({
//         ...tick,
//         label: stringLabel
//       });
//     }
//   }

//   // Set the filtered ticks on the axis instance
//   this.ticks = uniqueTicks;

//   return uniqueTicks;
// };

//I used this instead of the one above because if it spanned like years, it would cause ticks to be front loaded. This seems to fix that?
TimeScale.prototype.generateTickLabels = function (ticks) {
  const fmt =
    this.options.time?.displayFormats?.[this._unit] ||
    this.options.time?.displayFormats?.month ||
    'MMM';
  const adapter = this._adapter;
  const callback = this.options.ticks.callback;

  let lastLabel: string | null = null;
  ticks.forEach((tick, i) => {
    // get the formatted string
    const label = callback
      ? callback.call(this, tick.value, i, ticks)
      : adapter.format(tick.value, fmt);

    // if same as the last one, blank it; otherwise keep it
    if (label === lastLabel) {
      //   tick.label = '';
    } else {
      tick.label = String(label || '');
      lastLabel = String(label || '');
    }
  });
};
