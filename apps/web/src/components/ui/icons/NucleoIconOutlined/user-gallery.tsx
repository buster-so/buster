import type { iconProps } from './iconProps';

function userGallery(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user gallery';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="4.5"
          fill="none"
          r="2.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="11.5" cy="11.5" fill="currentColor" r="1.5" />
        <circle cx="15.5" cy="11.5" fill="currentColor" r="1.5" />
        <circle cx="11.5" cy="15.5" fill="currentColor" r="1.5" />
        <circle cx="15.5" cy="15.5" fill="currentColor" r="1.5" />
        <path
          d="M8.76,9.768c-2.445,.094-4.53,1.582-5.469,3.703-.365,.825,.087,1.774,.947,2.045,1.078,.339,2.477,.635,4.099,.705"
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

export default userGallery;
