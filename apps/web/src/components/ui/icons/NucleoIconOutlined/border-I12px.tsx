import type { iconProps } from './iconProps';

function border(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px border';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.25 1.25H10.75V10.75H1.25z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="6" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="6" cy="3.25" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="6" cy="8.75" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="3.25" cy="6" fill="currentColor" r=".75" strokeWidth="0" />
        <circle cx="8.75" cy="6" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default border;
