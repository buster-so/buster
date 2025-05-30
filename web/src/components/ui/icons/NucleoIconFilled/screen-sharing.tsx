import type { iconProps } from './iconProps';

function screenSharing(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px screen sharing';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2h-5.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5.25c.689,0,1.25,.561,1.25,1.25v6.5c0,.689-.561,1.25-1.25,1.25H3.75c-.689,0-1.25-.561-1.25-1.25v-1.25c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.25c0,1.517,1.233,2.75,2.75,2.75h4.5v1.031c-.923,.06-1.839,.225-2.726,.504-.395,.125-.614,.545-.489,.941,.124,.394,.541,.614,.94,.49,1.958-.617,4.087-.618,6.049,0,.075,.023,.151,.035,.226,.035,.319,0,.614-.205,.716-.525,.124-.395-.096-.816-.49-.94-.887-.279-1.803-.445-2.726-.504v-1.031h4.5c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M7.78,7.72L3.561,3.5h2.689c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H1.75c-.414,0-.75,.336-.75,.75V7.25c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-2.689l4.22,4.22c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default screenSharing;
