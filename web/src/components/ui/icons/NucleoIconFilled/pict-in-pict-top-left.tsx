import type { iconProps } from './iconProps';

function pictInPictTopLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pict in pict top left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2h-2.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.5c.689,0,1.25,.561,1.25,1.25V13.25c0,.689-.561,1.25-1.25,1.25H4.75c-.689,0-1.25-.561-1.25-1.25v-2.5c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v2.5c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M13.5,9.75c0-.414-.336-.75-.75-.75h-3c-.098,0-.195,.02-.287,.058-.183,.076-.329,.222-.405,.406-.038,.092-.058,.189-.058,.287v3c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.189l1.47,1.47c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.47-1.47h1.189c.414,0,.75-.336,.75-.75Z"
          fill="currentColor"
        />
        <rect height="7.5" width="7.5" fill="currentColor" rx="2.75" ry="2.75" x="2" y="2" />
      </g>
    </svg>
  );
}

export default pictInPictTopLeft;
