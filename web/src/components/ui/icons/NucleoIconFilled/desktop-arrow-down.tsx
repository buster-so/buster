import type { iconProps } from './iconProps';

function desktopArrowDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px desktop arrow down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.72,6.97c-.293,.293-.293,.768,0,1.061l2.75,2.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.75-2.75c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-1.47,1.47V2.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v5.689l-1.47-1.47c-.293-.293-.768-.293-1.061,0Z"
          fill="currentColor"
        />
        <path
          d="M14.25,2h-2.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.25c.689,0,1.25,.561,1.25,1.25v6.5c0,.689-.561,1.25-1.25,1.25H3.75c-.689,0-1.25-.561-1.25-1.25V4.75c0-.689,.561-1.25,1.25-1.25h2.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75h4.5v1.03c-.923,.06-1.84,.225-2.726,.504-.395,.125-.614,.545-.49,.941,.125,.395,.542,.614,.941,.49,1.961-.618,4.092-.617,6.049,0,.075,.023,.151,.035,.226,.035,.319,0,.614-.205,.715-.524,.125-.395-.095-.816-.49-.941-.886-.28-1.803-.445-2.726-.504v-1.03h4.5c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default desktopArrowDown;
