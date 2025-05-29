import type { iconProps } from './iconProps';

function vignette(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px vignette';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-5.25,10.75c-2.623,0-4.75-1.679-4.75-3.75s2.127-3.75,4.75-3.75,4.75,1.679,4.75,3.75-2.127,3.75-4.75,3.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default vignette;
