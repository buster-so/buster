import type { iconProps } from './iconProps';

function server(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px server';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="4"
          width="10.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x=".75"
          y=".75"
        />
        <rect
          height="4"
          width="10.5"
          fill="none"
          rx="1.5"
          ry="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x=".75"
          y="7.25"
        />
        <circle cx="2.75" cy="2.75" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="4.75" cy="2.75" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="2.75" cy="9.25" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="4.75" cy="9.25" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default server;
