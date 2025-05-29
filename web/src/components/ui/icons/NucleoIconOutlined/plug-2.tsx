import type { iconProps } from './iconProps';

function plug2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px plug 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.104,8.714l4.182,4.182c.391,.391,.391,1.024,0,1.414l-.28,.28c-1.545,1.545-4.051,1.545-5.596,0h0c-1.545-1.545-1.545-4.051,0-5.596l.28-.28c.391-.391,1.024-.391,1.414,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 16.25L3.409 14.591"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.945 9.555L7.5 8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.445 12.055L10 10.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.714,5.104l4.182,4.182c.391,.391,1.024,.391,1.414,0l.28-.28c1.545-1.545,1.545-4.051,0-5.596h0c-1.545-1.545-4.051-1.545-5.596,0l-.28,.28c-.391,.391-.391,1.024,0,1.414Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 1.75L14.591 3.409"
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

export default plug2;
