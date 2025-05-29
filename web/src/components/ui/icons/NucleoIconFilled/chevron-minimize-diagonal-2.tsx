import type { iconProps } from './iconProps';

function chevronMinimizeDiagonal2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px chevron minimize diagonal 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m4.75,5.5H.75c-.414,0-.75-.336-.75-.75s.336-.75.75-.75h3.25V.75c0-.414.336-.75.75-.75s.75.336.75.75v4c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m7.25,12c-.414,0-.75-.336-.75-.75v-4c0-.414.336-.75.75-.75h4c.414,0,.75.336.75.75s-.336.75-.75.75h-3.25v3.25c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default chevronMinimizeDiagonal2;
