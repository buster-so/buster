import type { iconProps } from './iconProps';

function arrowsExpandDiagonal3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrows expand diagonal 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m1.427,11.323c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L9.97.97c.293-.293.768-.293,1.061,0s.293.768,0,1.061L1.957,11.104c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.75,5.75c-.414,0-.75-.336-.75-.75v-3h-3c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h3.75c.414,0,.75.336.75.75v3.75c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m5,11.5H1.25c-.414,0-.75-.336-.75-.75v-3.75c0-.414.336-.75.75-.75s.75.336.75.75v3h3c.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowsExpandDiagonal3;
