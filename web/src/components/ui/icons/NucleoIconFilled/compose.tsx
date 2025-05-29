import type { iconProps } from './iconProps';

function compose(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px compose';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.25,7c-.414,0-.75,.336-.75,.75v5.5c0,.689-.561,1.25-1.25,1.25H4.75c-.689,0-1.25-.561-1.25-1.25V4.75c0-.689,.561-1.25,1.25-1.25h5.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V7.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M15.47,1.47L7.22,9.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22L16.53,2.53c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default compose;
