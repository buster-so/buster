import type { iconProps } from './iconProps';

function progressCircle5Of8(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px progress circle 5 of 8';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.163,3.07c-.854-.601-1.843-1.019-2.913-1.205"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.137,7.75c-.179-1.029-.583-2.023-1.208-2.912"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.93,13.163c.601-.854,1.019-1.843,1.205-2.913"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.25,16.137c1.029-.179,2.023-.583,2.912-1.208"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.837,14.93c.854,.601,1.843,1.019,2.913,1.205"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.863,10.25c.179,1.029,.583,2.023,1.208,2.912"
          fill="none"
          opacity=".3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.07,4.837c-.601,.854-1.019,1.843-1.205,2.913"
          fill="none"
          opacity=".3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.75,1.863c-1.029,.179-2.023,.583-2.912,1.208"
          fill="none"
          opacity=".3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default progressCircle5Of8;
