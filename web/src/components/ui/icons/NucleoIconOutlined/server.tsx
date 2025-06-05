import type { iconProps } from './iconProps';

function server(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px server';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="4.25" cy="5.25" fill="currentColor" r=".75" />
        <circle cx="6.75" cy="5.25" fill="currentColor" r=".75" />
        <circle cx="4.25" cy="12.75" fill="currentColor" r=".75" />
        <circle cx="6.75" cy="12.75" fill="currentColor" r=".75" />
        <rect
          height="5"
          width="14.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="2.75"
        />
        <rect
          height="5"
          width="14.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="10.25"
        />
      </g>
    </svg>
  );
}

export default server;
