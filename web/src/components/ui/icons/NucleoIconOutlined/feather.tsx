import type { iconProps } from './iconProps';

function feather(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px feather';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m12.974,8.731c-.4527,3.525-3.4373,4.0684-6.5358,3.5928"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m2.75,15.25S4.062,3.729,15.25,2.75c-.56.976-.573,2.605-.946,4.239-.524,2.011-2.335,2.261-4.554,2.261"
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

export default feather;
