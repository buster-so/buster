export type BarSortBy = ('asc' | 'desc' | 'none')[]; //OPTIONAL: default is no sorting (none). The first item in the array will be the primary sort. The second item will be the secondary sort. This will only apply if the X axis type is not a date.

export type PieSortBy = 'value' | 'key' | null; //OPTIONAL: default: value

//current is used for line charts with
export type ShowLegendHeadline =
  | false
  | 'current'
  | 'average'
  | 'total'
  | 'median'
  | 'average'
  | 'min'
  | 'max';
