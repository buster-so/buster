import type { iconProps } from './iconProps';

function moveObjDownRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px move obj down right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.25,6.75c-.414,0-.75.336-.75.75v1.939l-2.952-2.952c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l2.952,2.952h-1.939c-.414,0-.75.336-.75.75s.336.75.75.75h3.75c.414,0,.75-.336.75-.75v-3.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default moveObjDownRight;
