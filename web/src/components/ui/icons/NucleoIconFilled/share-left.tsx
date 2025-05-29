import type { iconProps } from './iconProps';

function shareLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px share left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,3h-3.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.5c.689,0,1.25,.561,1.25,1.25v7.5c0,.689-.561,1.25-1.25,1.25H5.75c-.689,0-1.25-.561-1.25-1.25v-2.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.5c0,1.517,1.233,2.75,2.75,2.75h7.5c1.517,0,2.75-1.233,2.75-2.75V5.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M5,9c.192,0,.384-.073,.53-.22,.293-.293,.293-.768,0-1.061l-1.97-1.97h1.689c1.792,0,3.25,1.458,3.25,3.25,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-2.619-2.131-4.75-4.75-4.75h-1.689l1.97-1.97c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0L1.22,4.47c-.293,.293-.293,.768,0,1.061l3.25,3.25c.146,.146,.338,.22,.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shareLeft;
