import type { iconProps } from './iconProps';

function pinStar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pin star';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="8"
          cy="7.5"
          fill="none"
          r="1.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.754,7.603c.011-.113,.026-.228,.026-.337,0-3.491-2.987-5.516-5.779-5.516S2.221,3.776,2.221,7.266c0,2.623,3.428,6.833,5.004,8.631,.413,.471,1.139,.471,1.551,0,.253-.288,.557-.644,.883-1.041"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14 10.068L15.004 12.103 17.25 12.429 15.625 14.013 16.009 16.25 14 15.194 11.991 16.25 12.375 14.013 10.75 12.429 12.996 12.103 14 10.068z"
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

export default pinStar;
