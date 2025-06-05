import type { iconProps } from './iconProps';

function cartBolt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cart bolt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m1.75,1.75l1.351.338c.393.098.688.424.747.825l1.153,7.838"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m9.8,4.75h-5.682"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m15.25,13.25H4.5c-.69,0-1.25-.56-1.25-1.25h0c0-.69.56-1.25,1.25-1.25h8.529c.43,0,.813-.275.949-.684l.105-.316"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.917 4.25L12.25 4.25 14.5 0.75 13.583 3.75 16.25 3.75 14 7.25 14.917 4.25z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="3.75" cy="15.75" fill="currentColor" r="1.25" strokeWidth="0" />
        <circle cx="14.25" cy="15.75" fill="currentColor" r="1.25" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default cartBolt;
