import type { iconProps } from './iconProps';

function viewMinusSign(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px view minus sign';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="8.501"
          fill="currentColor"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m14.6129,11.25c.553-.5669.9849-1.1414,1.2991-1.6174.45-.6831.45-1.582,0-2.2651-1.017-1.5439-3.262-4.1179-6.912-4.1179S3.106,5.8245,2.088,7.3674c-.45.6831-.45,1.582,0,2.2651.9506,1.4431,2.9748,3.7852,6.2157,4.0847"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 14.25L11.25 14.25"
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

export default viewMinusSign;
