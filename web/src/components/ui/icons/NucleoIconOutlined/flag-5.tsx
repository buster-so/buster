import type { iconProps } from './iconProps';

function flag5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flag 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75,10.239c.783-.172,1.975-.337,3.375-.114,1.313,.209,1.823,.604,2.91,.784,.943,.156,2.349,.156,4.215-.67V3.25c-1.79,.962-3.136,1.009-4.031,.875-1.165-.174-1.681-.669-3.094-.938-1.393-.265-2.594-.106-3.375,.062"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75 1.75L3.75 16.25"
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

export default flag5;
