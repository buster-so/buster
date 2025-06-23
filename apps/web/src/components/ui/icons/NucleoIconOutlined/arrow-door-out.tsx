import type { iconProps } from './iconProps';

function arrowDoorOut(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow door out';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.25,5.75V3.25c0-.552,.448-1,1-1h6.5c.552,0,1,.448,1,1V14.75c0,.552-.448,1-1,1H7.25c-.552,0-1-.448-1-1v-2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.5 6.25L0.75 9 3.5 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M0.75 9L6.75 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.543,2.648l-3.321,2.059c-.294,.182-.473,.504-.473,.85v6.887c0,.346,.179,.667,.473,.85l3.322,2.06"
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

export default arrowDoorOut;
