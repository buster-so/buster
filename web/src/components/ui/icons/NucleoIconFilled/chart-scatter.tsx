import type { iconProps } from './iconProps';

function chartScatter(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart scatter';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,15.5H4.75c-1.517,0-2.75-1.233-2.75-2.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V12.75c0,.689,.561,1.25,1.25,1.25H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <circle cx="6" cy="11" fill="currentColor" r="1" />
        <circle cx="7" cy="7" fill="currentColor" r="1" />
        <circle cx="10.5" cy="9" fill="currentColor" r="1" />
        <circle cx="11" cy="5" fill="currentColor" r="1" />
        <circle cx="14" cy="10.5" fill="currentColor" r="1" />
      </g>
    </svg>
  );
}

export default chartScatter;
