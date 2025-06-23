import type { iconProps } from './iconProps';

function pinRefresh(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pin refresh';

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
          d="M13.75 12.75L16.25 12.75 16.25 10.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.64,8.26c.088-.349,.139-.683,.139-.994,0-3.491-2.987-5.516-5.779-5.516S2.221,3.776,2.221,7.266c0,2.623,3.428,6.833,5.004,8.631,.413,.471,1.139,.471,1.551,0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.5,15.387c-.501,.531-1.212,.863-2,.863-1.519,0-2.75-1.231-2.75-2.75s1.231-2.75,2.75-2.75c1.166,0,2.162,.726,2.563,1.75"
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

export default pinRefresh;
