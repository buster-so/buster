import type { iconProps } from './iconProps';

function cursorDefault(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cursor default';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.07,3.463L6.451,15.293c.351,.948,1.694,.942,2.036-.009l1.626-4.517c.109-.304,.349-.543,.653-.653l4.517-1.626c.951-.342,.957-1.685,.009-2.036L3.463,2.07c-.869-.322-1.714,.524-1.393,1.393Z"
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

export default cursorDefault;
