import type { iconProps } from './iconProps';

function grid(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px grid';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="5"
          width="5"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="6.5"
          y=".5"
        />
        <rect
          height="5"
          width="5"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x=".5"
          y="6.5"
        />
        <rect
          height="5"
          width="5"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x=".5"
          y=".5"
        />
        <rect
          height="5"
          width="5"
          fill="currentColor"
          rx="1.75"
          ry="1.75"
          strokeWidth="0"
          x="6.5"
          y="6.5"
        />
      </g>
    </svg>
  );
}

export default grid;
