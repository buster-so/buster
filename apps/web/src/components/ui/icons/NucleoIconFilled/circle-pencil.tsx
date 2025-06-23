import type { iconProps } from './iconProps';

function circlePencil(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle pencil';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9,1C4.5889,1,1,4.5889,1,9s3.5889,8,8,8,8-3.5889,8-8S13.4111,1,9,1Zm-.7153,4.2739c.0986-.312.3882-.5239.7153-.5239s.6167.2119.7153.5239l1.0204,3.2314c-.0205-.0005-.0399-.0054-.0605-.0054h-3.3506c-.0206,0-.04.0049-.0605.0054l1.0204-3.2314Zm.7153,10.2261c-1.4758,0-2.8339-.5-3.9262-1.332l.5331-2.751c.1587-.8208.8809-1.417,1.7178-1.417h3.3506c.8369,0,1.5591.5962,1.7178,1.4175l.5331,2.7505c-1.0923.832-2.4504,1.332-3.9261,1.332Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default circlePencil;
