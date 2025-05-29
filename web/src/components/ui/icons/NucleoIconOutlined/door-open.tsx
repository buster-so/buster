import type { iconProps } from './iconProps';

function doorOpen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px door open';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.25,16V2c0-.357-.363-.599-.692-.462L3.865,3.494c-.373,.155-.615,.519-.615,.923V13.583c0,.404,.243,.768,.615,.923l4.692,1.955c.329,.137,.692-.105,.692-.462Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.75,3.25h2c.552,0,1,.448,1,1V13.75c0,.552-.448,1-1,1h-2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 8.5L6.75 9.5"
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

export default doorOpen;
