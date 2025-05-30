import type { iconProps } from './iconProps';

function nightShift(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px night shift';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,3c.414,0,.75-.336,.75-.75V.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.5c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.773,4.977c.192,0,.384-.073,.53-.22l1.061-1.061c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-1.061,1.061c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M17.25,8.25h-1.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M14.303,13.243c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.061,1.061c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.061-1.061Z"
          fill="currentColor"
        />
        <path
          d="M9,15c-.414,0-.75,.336-.75,.75v1.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M3.697,13.243l-1.061,1.061c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l1.061-1.061c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
        <path
          d="M3,9c0-.414-.336-.75-.75-.75H.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.5c.414,0,.75-.336,.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M3.697,4.757c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.061-1.061c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.061,1.061Z"
          fill="currentColor"
        />
        <path
          d="M9,4c-2.757,0-5,2.243-5,5s2.243,5,5,5,5-2.243,5-5-2.243-5-5-5Zm0,8.5c-1.93,0-3.5-1.57-3.5-3.5,0-1.073,.496-2.023,1.259-2.665,.046,2.688,2.219,4.861,4.907,4.907-.643,.763-1.592,1.259-2.665,1.259Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default nightShift;
