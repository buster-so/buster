import type { iconProps } from './iconProps';

function arrowDownRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow down right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.073,10.823c-.192,0-.384-.073-.53-.22L1.22,2.28c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l8.323,8.323c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.25,11h-4.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h4v-4c0-.414.336-.75.75-.75s.75.336.75.75v4.75c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowDownRight;
