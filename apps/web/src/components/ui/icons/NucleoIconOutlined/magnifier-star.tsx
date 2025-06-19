import type { iconProps } from './iconProps';

function magnifierStar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px magnifier star';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.25 15.5L12.285 11.535"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.859,6.957c.48-2.261,2.487-3.957,4.891-3.957,2.761,0,5,2.239,5,5,0,1.816-.968,3.405-2.416,4.281"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.5 8.843L6.582 11.034 9 11.386 7.25 13.091 7.663 15.5 5.5 14.363 3.337 15.5 3.75 13.091 2 11.386 4.418 11.034 5.5 8.843z"
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

export default magnifierStar;
