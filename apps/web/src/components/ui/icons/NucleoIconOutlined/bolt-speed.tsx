import type { iconProps } from './iconProps';

function boltSpeed(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bolt speed';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m11.15,16.127l5.397-7.987c.112-.166-.007-.39-.207-.39h-4.779l.846-5.707c.037-.252-.293-.381-.436-.169l-5.397,7.987c-.112.166.007.39.207.39h4.779l-.846,5.707c-.037.252.293.381.436.169Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M0.75 9L4 9"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.25 5.75L5.25 5.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.25 12.25L5.25 12.25"
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

export default boltSpeed;
