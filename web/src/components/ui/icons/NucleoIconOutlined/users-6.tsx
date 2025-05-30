import type { iconProps } from './iconProps';

function users6(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px users 6';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="7"
          fill="none"
          r="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="13.75"
          cy="3.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="4.25"
          cy="3.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.801,15.776c-.489-.148-.818-.635-.709-1.135,.393-1.797,1.993-3.142,3.908-3.142s3.515,1.345,3.908,3.142c.109,.499-.219,.987-.709,1.135-.821,.248-1.911,.474-3.199,.474s-2.378-.225-3.199-.474Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.584,7.248c.055-.002,.11-.004,.166-.004,1.673,0,3.079,1.147,3.473,2.697,.13,.511-.211,1.02-.718,1.167-.643,.186-1.457,.352-2.403,.385"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.416,7.248c-.055-.002-.11-.004-.166-.004-1.673,0-3.079,1.147-3.473,2.697-.13,.511,.211,1.02,.718,1.167,.643,.186,1.457,.352,2.403,.385"
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

export default users6;
