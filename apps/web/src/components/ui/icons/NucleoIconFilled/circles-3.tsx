import type { iconProps } from './iconProps';

function circles3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circles 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,1C4.589,1,1,4.589,1,9s3.589,8,8,8,8-3.589,8-8S13.411,1,9,1Zm0,14.5c-3.584,0-6.5-2.916-6.5-6.5S5.416,2.5,9,2.5s6.5,2.916,6.5,6.5-2.916,6.5-6.5,6.5Z"
          fill="currentColor"
        />
        <path
          d="M9,12.5c-1.93,0-3.5-1.57-3.5-3.5,0-.414-.336-.75-.75-.75s-.75,.336-.75,.75c0,2.757,2.243,5,5,5,.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M9,4c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75c1.93,0,3.5,1.57,3.5,3.5,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-2.757-2.243-5-5-5Z"
          fill="currentColor"
        />
        <circle cx="9" cy="9" fill="currentColor" r="2" />
      </g>
    </svg>
  );
}

export default circles3;
