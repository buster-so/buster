import type { iconProps } from './iconProps';

function grid3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px grid 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect
          height="4"
          width="4"
          fill="currentColor"
          rx="1.5"
          ry="1.5"
          strokeWidth="0"
          x="7"
          y="2"
        />
        <rect
          height="4"
          width="4"
          fill="currentColor"
          rx="1.5"
          ry="1.5"
          strokeWidth="0"
          x="2"
          y="2"
        />
        <rect
          height="4"
          width="4"
          fill="currentColor"
          rx="1.5"
          ry="1.5"
          strokeWidth="0"
          x="12"
          y="2"
        />
        <rect
          height="4"
          width="4"
          fill="currentColor"
          rx="1.5"
          ry="1.5"
          strokeWidth="0"
          x="7"
          y="7"
        />
        <rect
          height="4"
          width="4"
          fill="currentColor"
          rx="1.5"
          ry="1.5"
          strokeWidth="0"
          x="2"
          y="7"
        />
        <rect
          height="4"
          width="4"
          fill="currentColor"
          rx="1.5"
          ry="1.5"
          strokeWidth="0"
          x="12"
          y="7"
        />
        <rect
          height="4"
          width="4"
          fill="currentColor"
          rx="1.5"
          ry="1.5"
          strokeWidth="0"
          x="7"
          y="12"
        />
        <rect
          height="4"
          width="4"
          fill="currentColor"
          rx="1.5"
          ry="1.5"
          strokeWidth="0"
          x="2"
          y="12"
        />
        <rect
          height="4"
          width="4"
          fill="currentColor"
          rx="1.5"
          ry="1.5"
          strokeWidth="0"
          x="12"
          y="12"
        />
      </g>
    </svg>
  );
}

export default grid3;
