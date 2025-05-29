import type { iconProps } from './iconProps';

function arrowsDiagonalOppositeDirection(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrows diagonal opposite direction';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.72,6.72l-7.22,7.22v-2.7c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v4.51c0,.414,.336,.75,.75,.75h4.51c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-2.7l7.22-7.22c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0Z"
          fill="currentColor"
        />
        <path
          d="M10.5,6.76c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.25c0-.414-.336-.75-.75-.75H6.74c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2.7L2.22,10.22c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l7.22-7.22v2.7Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowsDiagonalOppositeDirection;
