import type { iconProps } from './iconProps';

function bagMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bag minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,15.5c-1.241,0-2.25-1.009-2.25-2.25s1.009-2.25,2.25-2.25h3.546l-.39-4.488c-.125-1.432-1.302-2.512-2.739-2.512h-.667v-1c0-1.654-1.346-3-3-3s-3,1.346-3,3v1h-.667c-1.437,0-2.615,1.08-2.739,2.512l-.652,7.5c-.067,.766,.193,1.53,.712,2.097s1.258,.892,2.027,.892H13.318c.769,0,1.508-.325,2.027-.892,.168-.183,.297-.391,.409-.608h-3.504ZM7.5,3c0-.827,.673-1.5,1.5-1.5s1.5,.673,1.5,1.5v1h-3v-1Z"
          fill="currentColor"
        />
        <path
          d="M17.25,12.5h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bagMinus;
