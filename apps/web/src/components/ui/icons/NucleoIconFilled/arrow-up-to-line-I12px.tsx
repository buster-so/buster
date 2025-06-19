import type { iconProps } from './iconProps';

function arrowUpToLine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow up to line';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.53,5.22c-.293-.293-.768-.293-1.061,0l-4,4c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l2.72-2.72v7.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V7.561l2.72,2.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-4-4Z"
          fill="currentColor"
        />
        <path
          d="M15.25,2H2.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowUpToLine;
