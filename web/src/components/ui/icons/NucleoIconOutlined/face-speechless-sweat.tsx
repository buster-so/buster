import type { iconProps } from './iconProps';

function faceSpeechlessSweat(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face speechless sweat';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="6" cy="9.5" fill="currentColor" r="1" />
        <circle cx="12" cy="9.5" fill="currentColor" r="1" />
        <path
          d="M7.75 12.25L10.25 12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5 8.25L13 8.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.3,2.129c-.724-.242-1.495-.379-2.3-.379C4.996,1.75,1.75,4.996,1.75,9s3.246,7.25,7.25,7.25,7.25-3.246,7.25-7.25c0-.283-.02-.561-.052-.835"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.353,5.75c1.047,0,1.897-.852,1.897-1.902,0-1.445-1.897-3.098-1.897-3.098,0,0-1.897,1.652-1.897,3.098,0,1.051,.849,1.902,1.897,1.902Z"
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

export default faceSpeechlessSweat;
