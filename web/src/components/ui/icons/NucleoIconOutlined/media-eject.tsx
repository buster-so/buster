import type { iconProps } from './iconProps';

function mediaEject(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px media eject';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.677,10.95L8.247,2.697c.33-.595,1.177-.595,1.506,0l4.57,8.254c.322,.582-.094,1.3-.753,1.3H4.43c-.66,0-1.075-.718-.753-1.3Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.5 15.25L3.5 15.25"
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

export default mediaEject;
