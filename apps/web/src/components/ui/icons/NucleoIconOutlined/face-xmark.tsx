import type { iconProps } from './iconProps';

function faceXmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px face xmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.25,11.758c-.472,.746-1.304,1.242-2.25,1.242s-1.778-.496-2.25-1.242"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M13 1L17 5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17 1L13 5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.689,1.956c-.543-.13-1.106-.206-1.689-.206C4.996,1.75,1.75,4.996,1.75,9s3.246,7.25,7.25,7.25,7.25-3.246,7.25-7.25c0-.583-.076-1.146-.206-1.689"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="9" fill="currentColor" r="1" />
        <circle cx="12" cy="9" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default faceXmark;
