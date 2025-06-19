import type { iconProps } from './iconProps';

function keyboard2Mouse(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px keyboard 2 mouse';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9.008 10.25L6.75 10.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,7.74v-2.99c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v6.5c0,1.104,.895,2,2,2h5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.75 13.25L13.75 12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="6.875" y="7" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="4.125" y="7" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="9.625" y="7" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="12.375" y="7" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="5.5" y="5" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="8.25" y="5" />
        <rect height="1.5" width="1.5" fill="currentColor" rx=".5" ry=".5" x="11" y="5" />
        <rect
          height="7.5"
          width="5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="11.25"
          y="9.75"
        />
      </g>
    </svg>
  );
}

export default keyboard2Mouse;
