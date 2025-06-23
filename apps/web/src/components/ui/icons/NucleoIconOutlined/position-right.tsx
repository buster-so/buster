import type { iconProps } from './iconProps';

function positionRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px position right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="12.5"
          width="3.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="11.75"
          y="2.75"
        />
        <circle cx="9" cy="15.25" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="9" cy="2.75" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="2.75" cy="9" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="5.875" cy="2.75" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="2.75" cy="2.75" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="5.875" cy="15.25" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="2.75" cy="15.25" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="2.75" cy="12.125" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="2.75" cy="5.875" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default positionRight;
