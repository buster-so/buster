import type { iconProps } from './iconProps';

function eclipse(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px eclipse';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.876,1.995c3.095,.827,5.374,3.65,5.374,7.005s-2.272,6.169-5.359,7.001"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.5,9c0-3.354,2.281-6.169,5.375-6.996-.599-.16-1.225-.254-1.875-.254C4.996,1.75,1.75,4.996,1.75,9s3.246,7.25,7.25,7.25c.65,0,1.276-.094,1.875-.254-3.094-.827-5.375-3.642-5.375-6.996Z"
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

export default eclipse;
