import type { iconProps } from './iconProps';

function album(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px album';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m2.777,10.056l-1.607-5c-.207-.646.274-1.306.952-1.306h7.756c.678,0,1.16.66.952,1.306l-1.607,5c-.133.414-.518.694-.952.694H3.729c-.434,0-.819-.28-.952-.694Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.25 0.75L2.75 0.75"
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

export default album;
