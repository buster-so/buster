import type { iconProps } from './iconProps';

function invoiceDollar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px invoice dollar';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.75,3.75v12.5l-2.75-1.5-3,1.5-3-1.5-2.75,1.5V3.75c0-1.105,.895-2,2-2h7.5c1.105,0,2,.895,2,2Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.724,6.556c-.374-.885-1.122-1.086-1.688-1.086-.526,0-1.907,.28-1.779,1.606,.09,.931,.967,1.277,1.734,1.414s1.88,.429,1.907,1.551c.023,.949-.83,1.597-1.861,1.597-.985,0-1.67-.383-1.934-1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 4.75L9 5.47"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 11.638L9 12.25"
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

export default invoiceDollar;
