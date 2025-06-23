import type { iconProps } from './iconProps';

function arrowTriangleLineUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow triangle line up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m6,11.75c-.414,0-.75-.336-.75-.75v-5.75c0-.414.336-.75.75-.75s.75.336.75.75v5.75c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6.986.797c-.477-.613-1.496-.613-1.973,0l-2.478,3.185c-.296.38-.348.885-.137,1.317.211.433.642.701,1.123.701h4.955c.481,0,.912-.269,1.123-.701.211-.432.159-.937-.137-1.317L6.986.797Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowTriangleLineUp;
