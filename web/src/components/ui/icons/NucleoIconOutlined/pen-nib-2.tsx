import type { iconProps } from './iconProps';

function penNib2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pen nib 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.044 15.956L7.442 10.558"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.93,8.43l-1.88,5.309c-.117,.33-.397,.575-.74,.645l-8.583,1.776c-.528,.109-.996-.358-.886-.886L3.616,6.69c.071-.343,.316-.623,.645-.74l5.309-1.88"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.25,1.75l-.293,.293c-.391,.391-.391,1.024,0,1.414l5.586,5.586c.391,.391,1.024,.391,1.414,0l.293-.293"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="7.973"
          cy="10.027"
          fill="currentColor"
          r=".75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default penNib2;
