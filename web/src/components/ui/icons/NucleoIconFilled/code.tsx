import type { iconProps } from './iconProps';

function code(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px code';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m7.811,10.189c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061l2.909-2.909-2.909-2.909c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l3.439,3.439c.293.293.293.768,0,1.061l-3.439,3.439c-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.189,10.189c-.192,0-.384-.073-.53-.22L.22,6.53c-.293-.293-.293-.768,0-1.061l3.439-3.439c.293-.293.768-.293,1.061,0s.293.768,0,1.061l-2.909,2.909,2.909,2.909c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default code;
