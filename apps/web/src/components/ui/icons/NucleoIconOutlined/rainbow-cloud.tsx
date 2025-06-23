import type { iconProps } from './iconProps';

function rainbowCloud(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px rainbow cloud';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.75,11.25v-1c0-1.105,.895-2,2-2,.473,0,.908,.164,1.25,.439"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4,11.25v-1c0-2.623,2.127-4.75,4.75-4.75,1.366,0,2.597,.577,3.464,1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.25,11.25v-1c0-4.142,3.358-7.5,7.5-7.5,2.837,0,5.306,1.575,6.58,3.898"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,9.25c-1.347,0-2.473,.894-2.852,2.116-.204-.07-.42-.116-.648-.116-1.105,0-2,.896-2,2s.895,2,2,2h3.5c1.657,0,3-1.343,3-3s-1.343-3-3-3Z"
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

export default rainbowCloud;
