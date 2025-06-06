import type { iconProps } from './iconProps';

function ticket2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ticket 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.5,9c0-.967,.784-1.75,1.75-1.75v-1.5c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v1.5c.966,0,1.75,.783,1.75,1.75s-.784,1.75-1.75,1.75v1.5c0,1.104,.895,2,2,2H14.25c1.105,0,2-.896,2-2v-1.5c-.966,0-1.75-.783-1.75-1.75Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="11.25" cy="8.875" fill="currentColor" r=".75" />
        <circle cx="11.25" cy="6.25" fill="currentColor" r=".75" />
        <circle cx="11.25" cy="11.75" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default ticket2;
