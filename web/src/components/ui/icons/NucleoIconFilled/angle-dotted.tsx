import type { iconProps } from './iconProps';

function angleDotted(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px angle dotted';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,16H4.75c-1.517,0-2.75-1.233-2.75-2.75V2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V13.25c0,.689,.561,1.25,1.25,1.25H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <circle cx="5.429" cy="8.783" fill="currentColor" r=".75" />
        <circle cx="7.7" cy="10.3" fill="currentColor" r=".75" />
        <circle cx="9.217" cy="12.571" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default angleDotted;
