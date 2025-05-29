import type { iconProps } from './iconProps';

function label(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px label';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.095,5.348l-3.92-3.547c-.67-.605-1.679-.605-2.348,0l-3.921,3.547h0c-.575,.521-.905,1.264-.905,2.04v6.862c0,1.517,1.233,2.75,2.75,2.75h6.5c1.517,0,2.75-1.233,2.75-2.75V7.388c0-.775-.33-1.519-.905-2.04Zm-5.095,2.652c-.689,0-1.25-.561-1.25-1.25s.561-1.25,1.25-1.25,1.25,.561,1.25,1.25-.561,1.25-1.25,1.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default label;
