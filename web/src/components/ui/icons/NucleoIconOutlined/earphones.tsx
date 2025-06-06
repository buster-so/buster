import type { iconProps } from './iconProps';

function earphones(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px earphones';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5.25,8.75c-.675,0-1.287-.374-1.737-.983"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25,1.75c-.55,0-.979,.221-.979,.221-.926,.408-3.021,1.675-3.021,6.279v7c0,.552,.448,1,1,1h1c.552,0,1-.448,1-1v-6.795c.307,.188,.644,.295,1,.295,1.381,0,2.5-1.567,2.5-3.5s-1.119-3.5-2.5-3.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25 4.75L5.25 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,8.75c.675,0,1.287-.374,1.737-.983"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75,1.75c.55,0,.979,.221,.979,.221,.926,.408,3.021,1.675,3.021,6.279v7c0,.552-.448,1-1,1h-1c-.552,0-1-.448-1-1v-6.795c-.307,.188-.644,.295-1,.295-1.381,0-2.5-1.567-2.5-3.5s1.119-3.5,2.5-3.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 4.75L12.75 5.75"
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

export default earphones;
