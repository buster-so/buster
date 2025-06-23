import type { iconProps } from './iconProps';

function border(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px border';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75 2.75H15.25V15.25H2.75z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="5.875" cy="9" fill="currentColor" r=".75" />
        <circle cx="9" cy="9" fill="currentColor" r=".75" />
        <circle cx="12.125" cy="9" fill="currentColor" r=".75" />
        <circle cx="9" cy="12.125" fill="currentColor" r=".75" />
        <circle cx="9" cy="5.875" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default border;
