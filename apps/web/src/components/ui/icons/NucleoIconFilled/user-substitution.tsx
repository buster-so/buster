import type { iconProps } from './iconProps';

function userSubstitution(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user substitution';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="6.807" cy="5" fill="currentColor" r="3" />
        <path
          d="M17.78,7.72l-2-2c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l.72,.72h-3.189c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.189l-.72,.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2-2c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <path
          d="M9.659,14.841c-.425-.425-.659-.99-.659-1.591s.234-1.166,.659-1.591l1.18-1.18c-1.106-.938-2.52-1.479-4.033-1.479-2.369,0-4.505,1.315-5.575,3.432-.282,.557-.307,1.213-.069,1.801,.246,.607,.741,1.079,1.358,1.293,1.385,.48,2.827,.724,4.286,.724,1.26,0,2.503-.192,3.711-.551l-.858-.858Z"
          fill="currentColor"
        />
        <path
          d="M16.25,12.5h-3.189l.72-.72c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-2,2c-.293,.293-.293,.768,0,1.061l2,2c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-.72-.72h3.189c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userSubstitution;
