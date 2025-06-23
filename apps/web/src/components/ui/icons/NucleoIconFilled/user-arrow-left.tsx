import type { iconProps } from './iconProps';

function userArrowLeft(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user arrow left';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M10.159,14.341c-.425-.425-.659-.99-.659-1.591s.234-1.166,.659-1.591l1.584-1.584c-.853-.366-1.78-.575-2.743-.575-2.764,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.591,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,1.16,0,2.313-.131,3.446-.372l-2.287-2.287Z"
          fill="currentColor"
        />
        <path
          d="M16.75,12h-3.189l1.22-1.22c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-2.5,2.5c-.293,.293-.293,.768,0,1.061l2.5,2.5c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.22-1.22h3.189c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userArrowLeft;
