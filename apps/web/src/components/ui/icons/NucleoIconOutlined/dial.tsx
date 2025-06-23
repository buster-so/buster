import type { iconProps } from './iconProps';

function dial(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px dial';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M12.712 12.712L9 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="5.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="9" cy=".75" fill="currentColor" r=".75" />
        <circle cx="14.834" cy="3.166" fill="currentColor" r=".75" />
        <circle cx="17.25" cy="9" fill="currentColor" r=".75" />
        <circle cx="14.834" cy="14.834" fill="currentColor" r=".75" />
        <circle cx="3.166" cy="14.834" fill="currentColor" r=".75" />
        <circle cx=".75" cy="9" fill="currentColor" r=".75" />
        <circle cx="3.166" cy="3.166" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default dial;
