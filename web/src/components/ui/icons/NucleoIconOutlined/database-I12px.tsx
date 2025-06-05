import type { iconProps } from './iconProps';

function database(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px database';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.75,2.438v7.125c0,.932,1.903,1.688,4.25,1.688s4.25-.755,4.25-1.688V2.438"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m1.75,6c0,.932,1.903,1.688,4.25,1.688s4.25-.755,4.25-1.688"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <ellipse
          cx="6"
          cy="2.438"
          fill="none"
          rx="4.25"
          ry="1.688"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default database;
