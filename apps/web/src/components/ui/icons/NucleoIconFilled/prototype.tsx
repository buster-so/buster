import type { iconProps } from './iconProps';

function prototype(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px prototype';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M17.78,8.47l-2.5-2.5c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.22,1.22h-3.614c-.281-.59-.878-1-1.575-1-.966,0-1.75,.783-1.75,1.75s.784,1.75,1.75,1.75c.697,0,1.294-.41,1.575-1h3.614l-1.22,1.22c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l2.5-2.5c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <path
          d="M7,9c0-1.792,1.458-3.25,3.25-3.25,.259,0,.508,.038,.75,.096V2.75c0-.965-.785-1.75-1.75-1.75H3.75c-.965,0-1.75,.785-1.75,1.75V15.25c0,.965,.785,1.75,1.75,1.75h5.5c.965,0,1.75-.785,1.75-1.75v-3.096c-.242,.058-.491,.096-.75,.096-1.792,0-3.25-1.458-3.25-3.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default prototype;
