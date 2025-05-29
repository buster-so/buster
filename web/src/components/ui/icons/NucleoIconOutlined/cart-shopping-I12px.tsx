import type { iconProps } from './iconProps';

function cartShopping(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px cart shopping';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="9.5" cy="11" fill="currentColor" r="1" strokeWidth="0" />
        <circle cx="3" cy="11" fill="currentColor" r="1" strokeWidth="0" />
        <path
          d="m2.255,3.25h8.135c.316,0,.552.289.49.598l-.639,3.196c-.14.701-.756,1.206-1.471,1.206h-4.477c-.743,0-1.374-.544-1.484-1.279l-.727-4.88c-.051-.342-.275-.633-.591-.77l-.74-.321"
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

export default cartShopping;
