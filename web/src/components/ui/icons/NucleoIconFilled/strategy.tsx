import type { iconProps } from './iconProps';

function strategy(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px strategy';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.776,7.224c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l1.413-1.413,1.413,1.413c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.413-1.413,1.413-1.413c.293-.293,.293-.768,0-1.061s-.768-.293-1.061,0l-1.413,1.413-1.413-1.413c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.413,1.413-1.413,1.413c-.293,.293-.293,.768,0,1.061Z"
          fill="currentColor"
        />
        <path
          d="M15.724,10.276c-.293-.293-.768-.293-1.061,0l-1.413,1.413-1.413-1.413c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.413,1.413-1.413,1.413c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l1.413-1.413,1.413,1.413c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061l-1.413-1.413,1.413-1.413c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <path
          d="M15.25,2h-3.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.689l-6.492,6.492c-.496-.306-1.074-.492-1.698-.492-1.792,0-3.25,1.458-3.25,3.25s1.458,3.25,3.25,3.25,3.25-1.458,3.25-3.25c0-.624-.185-1.202-.492-1.698l6.492-6.492v1.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V2.75c0-.414-.336-.75-.75-.75ZM5.25,14.5c-.965,0-1.75-.785-1.75-1.75s.785-1.75,1.75-1.75,1.75,.785,1.75,1.75-.785,1.75-1.75,1.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default strategy;
