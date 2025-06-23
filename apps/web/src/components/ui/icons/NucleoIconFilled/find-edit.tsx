import type { iconProps } from './iconProps';

function findEdit(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px find edit';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.8812,12.9417c-.5444.3494-1.1877.5583-1.8812.5583-1.9297,0-3.5-1.5703-3.5-3.5s1.5703-3.5,3.5-3.5,3.5,1.5703,3.5,3.5c0,.6934-.2089,1.3367-.5583,1.8811l4.0583,4.0583V6.6646c0-.4678-.1816-.9072-.5127-1.2378l-3.9141-3.9141c-.3301-.3306-.7695-.5127-1.2373-.5127h-5.5859c-1.5166,0-2.75,1.2334-2.75,2.75v10.5c0,1.5166,1.2334,2.75,2.75,2.75h10.1895l-4.0583-4.0583Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <circle cx="9" cy="10" fill="currentColor" r="2" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default findEdit;
