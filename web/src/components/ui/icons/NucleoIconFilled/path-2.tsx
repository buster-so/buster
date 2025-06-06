import type { iconProps } from './iconProps';

function path2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px path 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.75,12h-3.625c-.896,0-1.625-.729-1.625-1.625s.729-1.625,1.625-1.625h7.75c1.723,0,3.125-1.402,3.125-3.125s-1.402-3.125-3.125-3.125H5.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h7.625c.896,0,1.625,.729,1.625,1.625s-.729,1.625-1.625,1.625H5.125c-1.723,0-3.125,1.402-3.125,3.125s1.402,3.125,3.125,3.125h3.625c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <circle cx="13.25" cy="12.75" fill="currentColor" r="2.75" />
      </g>
    </svg>
  );
}

export default path2;
