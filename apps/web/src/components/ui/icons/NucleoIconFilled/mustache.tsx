import type { iconProps } from './iconProps';

function mustache(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px mustache';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.623,7.627c-.233-.133-.521-.131-.752,.004-.576,.339-1.264-.178-2.329-1.066-.933-.777-1.902-1.607-3.049-1.564-.949,.048-1.829,.433-2.493,1.068-.666-.635-1.553-1.021-2.529-1.069-1.134,0-2.088,.796-3.011,1.565-1.065,.889-1.752,1.405-2.329,1.066-.231-.135-.519-.137-.752-.004-.233,.134-.377,.382-.377,.651,0,2.321,1.964,4.722,5.249,4.722h.007c1.389,0,2.736-.534,3.744-1.458,1.008,.924,2.354,1.458,3.743,1.458h.007c3.286,0,5.25-2.401,5.25-4.722,0-.269-.144-.517-.377-.651Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default mustache;
