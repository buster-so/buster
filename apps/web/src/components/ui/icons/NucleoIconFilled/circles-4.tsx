import type { iconProps } from './iconProps';

function circles4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circles 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,15.5c-3.584,0-6.5-2.916-6.5-6.5,0-.414-.336-.75-.75-.75s-.75,.336-.75,.75c0,4.411,3.589,8,8,8,.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M9,1c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75c3.584,0,6.5,2.916,6.5,6.5,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-4.411-3.589-8-8-8Z"
          fill="currentColor"
        />
        <circle cx="9" cy="9" fill="currentColor" r="5" />
      </g>
    </svg>
  );
}

export default circles4;
