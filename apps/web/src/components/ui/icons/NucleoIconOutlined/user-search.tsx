import type { iconProps } from './iconProps';

function userSearch(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user search';

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
        <circle
          cx="13"
          cy="13"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.522,9.789c-.174-.015-.345-.039-.522-.039-2.551,0-4.739,1.53-5.709,3.72-.365,.825,.087,1.774,.947,2.045,1.225,.386,2.846,.734,4.762,.734,.186,0,.355-.017,.535-.023"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.59 14.59L16.25 16.25"
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

export default userSearch;
