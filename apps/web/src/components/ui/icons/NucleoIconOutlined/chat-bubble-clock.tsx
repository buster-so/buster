import type { iconProps } from './iconProps';

function chatBubbleClock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bubble clock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.75,7.524v-2.774c0-1.104-.895-2-2-2H4.25c-1.105,0-2,.896-2,2v11.5l3.75-3h2.263"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.156 13.476L14 13 14 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="14"
          cy="13"
          fill="none"
          r="3.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default chatBubbleClock;
