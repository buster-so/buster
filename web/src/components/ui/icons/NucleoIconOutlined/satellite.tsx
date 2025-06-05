import type { iconProps } from './iconProps';

function satellite(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px satellite';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.25,13.75c-1.657,0-3-1.343-3-3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,16.75c-3.314,0-6-2.686-6-6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.043,11.043l-1.086-1.086c-.391-.391-.391-1.024,0-1.414L13.146,2.354c.622-.622,1.621-.784,2.339-.277,.915,.645,1.001,1.937,.238,2.7l-6.266,6.266c-.391,.391-1.024,.391-1.414,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.5 4.45L9.275 6.225"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.55 10.5L11.775 8.725"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="4.25"
          width="2.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(135 5.972 2.972)"
          x="4.722"
          y=".847"
        />
        <rect
          height="4.25"
          width="2.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(135 15.028 12.028)"
          x="13.778"
          y="9.903"
        />
      </g>
    </svg>
  );
}

export default satellite;
