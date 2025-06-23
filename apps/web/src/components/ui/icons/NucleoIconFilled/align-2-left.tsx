import type { iconProps } from './iconProps';

function align2Left(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px align 2 left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m.75,12c-.414,0-.75-.336-.75-.75V.75c0-.414.336-.75.75-.75s.75.336.75.75v10.5c0,.414-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <rect
          height="6"
          width="9"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="3"
          y="3"
        />
      </g>
    </svg>
  );
}

export default align2Left;
