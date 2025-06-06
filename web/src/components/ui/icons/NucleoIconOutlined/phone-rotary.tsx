import type { iconProps } from './iconProps';

function phoneRotary(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px phone rotary';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.799,7.169l3.265,4.57c.121,.17,.186,.373,.186,.581v1.93c0,.552-.448,1-1,1H3.75c-.552,0-1-.448-1-1v-1.93c0-.208,.065-.412,.186-.581l3.265-4.57c.188-.263,.491-.419,.814-.419h3.971c.323,0,.626,.156,.814,.419Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,8.25c.552,0,1-.448,1-1v-.962c0-.685-.344-1.321-.923-1.688-1.244-.787-3.439-1.85-6.327-1.85-2.887,0-5.083,1.063-6.327,1.85-.579,.366-.923,1.002-.923,1.688v.962c0,.552,.448,1,1,1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 5.25L6.75 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.25 5.25L11.25 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="11"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default phoneRotary;
