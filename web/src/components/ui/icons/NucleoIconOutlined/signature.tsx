import type { iconProps } from './iconProps';

function signature(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px signature';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.75,5.25H7.75c.552,0,1,.448,1,1v3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.995,16.25c1.914-3.398,2.933-4.274,3.491-4.099,.895,.279,.635,3.275,1.583,3.45,.699,.129,1.318-1.41,2.07-1.218,.607,.155,.57,1.249,1.258,1.461,.276,.085,.574,0,.853-.156"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,12.5c0,2-1.75,3.75-1.75,3.75,0,0-1.75-1.75-1.75-3.75V3.5c0-.966,.784-1.75,1.75-1.75h0c.966,0,1.75,.784,1.75,1.75V12.5Z"
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

export default signature;
