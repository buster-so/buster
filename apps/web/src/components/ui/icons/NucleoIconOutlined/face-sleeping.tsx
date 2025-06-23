import type { iconProps } from './iconProps';

function faceSleeping(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face sleeping';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="9.5" cy="12" fill="currentColor" r="1" />
        <path
          d="M6.985,8c-.126,.119-.554,.496-1.228,.559-.636,.06-1.105-.195-1.258-.286"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.015,8c.126,.119,.554,.496,1.228,.559,.636,.06,1.105-.195,1.258-.286"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 0.75L17.25 0.75 13.75 4.75 17.25 4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.173,2.757c-1.078-.636-2.331-1.007-3.673-1.007C4.496,1.75,1.25,4.996,1.25,9s3.246,7.25,7.25,7.25,7.25-3.246,7.25-7.25c0-.604-.082-1.188-.222-1.75"
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

export default faceSleeping;
