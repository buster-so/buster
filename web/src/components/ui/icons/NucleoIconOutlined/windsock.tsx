import type { iconProps } from './iconProps';

function windsock(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px windsock';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75 16.25L3.75 1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.853,8.334l-8.5,1.789c-.311,.065-.603-.172-.603-.489V3.366c0-.318,.292-.555,.603-.489l8.5,1.789c.231,.049,.397,.253,.397,.489v2.689c0,.236-.166,.441-.397,.489Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.75 3.382L9.75 9.618"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13.25 4.118L13.25 8.882"
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

export default windsock;
