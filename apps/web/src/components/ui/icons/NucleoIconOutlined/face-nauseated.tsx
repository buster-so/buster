import type { iconProps } from './iconProps';

function faceNauseated(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face nauseated';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.485,7.75c-.126,.119-.554,.496-1.228,.559-.636,.06-1.105-.195-1.258-.286"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.515,7.75c.126,.119,.554,.496,1.228,.559,.636,.06,1.105-.195,1.258-.286"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6,12.896c.441-.193,.75-.633,.75-1.146,0-.605-.429-1.109-1-1.225"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12,12.896c-.441-.193-.75-.633-.75-1.146,0-.605,.429-1.109,1-1.225"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.742,11.616c.897-.219,1.679-.272,2.258-.272s1.361,.053,2.258,.272"
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

export default faceNauseated;
