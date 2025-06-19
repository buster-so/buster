import type { iconProps } from './iconProps';

function sortTopToBottom2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sort top to bottom 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.25,13.5H2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H6.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M2.25,9.75H12.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,3H2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H13.75c.689,0,1.25,.561,1.25,1.25v6.5c0,.689-.561,1.25-1.25,1.25h-2.689l.97-.97c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-2.25,2.25c-.293,.293-.293,.768,0,1.061l2.25,2.25c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-.97-.97h2.689c1.517,0,2.75-1.233,2.75-2.75V5.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sortTopToBottom2;
