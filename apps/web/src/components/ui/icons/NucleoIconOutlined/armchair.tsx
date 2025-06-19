import type { iconProps } from './iconProps';

function armchair(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px armchair';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.75,6.25V3.75c0-1.105,.895-2,2-2h6.5c1.105,0,2,.895,2,2v2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 8.75L12.25 8.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,8.25c0-1.104-.895-2-2-2s-2,.896-2,2v3H5.75v-3c0-1.104-.895-2-2-2s-2,.896-2,2c0,.738,.405,1.376,1,1.723v2.277c0,1.104,.895,2,2,2H13.25c1.105,0,2-.896,2-2v-2.277c.595-.346,1-.984,1-1.723Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25 14.25L5.25 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.75 14.25L12.75 16.25"
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

export default armchair;
