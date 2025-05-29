import type { iconProps } from './iconProps';

function users4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="5.25"
          cy="5"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="12.75"
          cy="5"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.051,13.776c-.489-.148-.818-.635-.709-1.135,.393-1.797,1.993-3.142,3.908-3.142s3.515,1.345,3.908,3.142c.109,.499-.219,.987-.709,1.135-.821,.248-1.911,.474-3.199,.474s-2.378-.225-3.199-.474Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.967,9.918c.537-.268,1.142-.418,1.783-.418,1.915,0,3.515,1.345,3.908,3.142,.109,.499-.219,.987-.709,1.135-.821,.248-1.911,.474-3.199,.474-.446,0-.869-.027-1.264-.073"
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

export default users4;
