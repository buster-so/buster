import type { iconProps } from './iconProps';

function cartPen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cart pen';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,1.75l1.351,.338c.393,.098,.688,.424,.747,.825l1.153,7.838"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.969 4.75L4.118 4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25,13.25H4.5c-.69,0-1.25-.56-1.25-1.25h0c0-.69,.56-1.25,1.25-1.25H13.029c.43,0,.813-.275,.949-.684l1.333-4c.013-.04,.024-.081,.032-.121"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.207,6.401c.143-.049,.273-.131,.38-.238l3.303-3.303c.483-.483,.478-1.261-.005-1.745h0c-.483-.483-1.261-.489-1.745-.005l-3.303,3.303c-.107,.107-.189,.237-.238,.38l-.849,2.457,2.457-.849Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="3.75" cy="15.75" r="1.25" />
        <circle cx="14.25" cy="15.75" r="1.25" />
      </g>
    </svg>
  );
}

export default cartPen;
