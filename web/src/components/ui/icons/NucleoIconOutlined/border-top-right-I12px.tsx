import type { iconProps } from './iconProps';

function borderTopRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px border top right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="4.417" cy="10.75" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="7.583" cy="10.75" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="1.25" cy="4.417" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="1.25" cy="7.583" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="1.25" cy="10.75" fill="currentColor" r=".75" strokeWidth="0" />
        <path
          d="M1.25 1.25L10.75 1.25 10.75 10.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default borderTopRight;
