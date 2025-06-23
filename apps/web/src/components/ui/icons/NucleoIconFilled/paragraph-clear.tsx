import type { iconProps } from './iconProps';

function paragraphClear(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paragraph clear';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.5,14.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M6.5,11H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h3.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,7.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,4H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.311,12.75l1.72-1.72c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-1.72,1.72-1.72-1.72c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.72,1.72-1.72,1.72c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l1.72-1.72,1.72,1.72c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.72-1.72Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default paragraphClear;
