import type { iconProps } from './iconProps';

function arrowTriangleLineDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow triangle line down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,7.5c-.414,0-.75-.336-.75-.75V1c0-.414.336-.75.75-.75s.75.336.75.75v5.75c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m9.601,6.701c-.211-.433-.642-.701-1.123-.701H3.522c-.481,0-.912.269-1.123.701-.211.432-.159.937.137,1.317l2.478,3.185c.238.307.598.482.986.482s.748-.176.986-.482l2.478-3.185c.296-.38.348-.885.137-1.317Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowTriangleLineDown;
