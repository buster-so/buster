import type { iconProps } from './iconProps';

function siren(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px siren';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.25,9.75c-.414,0-.75-.336-.75-.75,0-1.378,1.122-2.5,2.5-2.5,.414,0,.75,.336,.75,.75s-.336,.75-.75,.75c-.551,0-1,.449-1,1,0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9,3c-.414,0-.75-.336-.75-.75V.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.5c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.773,4.977c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l1.061-1.061c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-1.061,1.061c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M17.25,9.75h-1.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M4.227,4.977c-.192,0-.384-.073-.53-.22l-1.061-1.061c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l1.061,1.061c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M2.25,9.75H.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.25,14.5c-.414,0-.75-.336-.75-.75v-4.75c0-1.93-1.57-3.5-3.5-3.5s-3.5,1.57-3.5,3.5v4.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-4.75c0-2.757,2.243-5,5-5s5,2.243,5,5v4.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <rect height="4" width="13" fill="currentColor" rx="1.25" ry="1.25" x="2.5" y="13" />
      </g>
    </svg>
  );
}

export default siren;
