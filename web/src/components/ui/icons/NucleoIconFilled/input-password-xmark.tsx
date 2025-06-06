import type { iconProps } from './iconProps';

function inputPasswordXmark(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px input password xmark';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="5.5" cy="9" fill="currentColor" r="1" />
        <circle cx="9" cy="9" fill="currentColor" r="1" />
        <circle cx="12.5" cy="9" fill="currentColor" r="1" />
        <path
          d="M10.764,12.5H3.75c-.689,0-1.25-.561-1.25-1.25V6.75c0-.689,.561-1.25,1.25-1.25H14.25c.689,0,1.25,.561,1.25,1.25v2.553c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.553c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v4.5c0,1.517,1.233,2.75,2.75,2.75h7.014c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M17.28,11.22c-.293-.293-.768-.293-1.061,0l-1.47,1.47-1.47-1.47c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.47,1.47-1.47,1.47c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l1.47-1.47,1.47,1.47c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.47-1.47,1.47-1.47c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default inputPasswordXmark;
