import type { iconProps } from './iconProps';

function chevronMaximizeDiagonal2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chevron maximize diagonal 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m1.75,6.5c-.414,0-.75-.336-.75-.75V1.75c0-.414.336-.75.75-.75h4c.414,0,.75.336.75.75s-.336.75-.75.75h-3.25v3.25c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.25,11h-4c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h3.25v-3.25c0-.414.336-.75.75-.75s.75.336.75.75v4c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default chevronMaximizeDiagonal2;
