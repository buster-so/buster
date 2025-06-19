import type { iconProps } from './iconProps';

function personDoor(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px person door';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.75,1.75h2.5c1.105,0,2,.895,2,2V14.25c0,1.105-.895,2-2,2h-2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,16.25l1.842-8.889c.079-.38,.541-.529,.827-.267l1.55,1.419c.317,.291,.785,.346,1.161,.137l1.62-.9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.264,7.918l-.379,.166c-.247,.108-.44,.312-.535,.565l-.601,1.602"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.968,11.631l.637,.382c.251,.151,.424,.404,.472,.693l.424,2.544"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="6.5"
          cy="3.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default personDoor;
