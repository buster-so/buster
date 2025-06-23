import type { iconProps } from './iconProps';

function bagAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bag alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.406,6.512c-.125-1.432-1.302-2.512-2.739-2.512h-.667v-1c0-1.654-1.346-3-3-3s-3,1.346-3,3v1h-.667c-1.437,0-2.615,1.08-2.739,2.512l-.652,7.5c-.067,.766,.193,1.53,.712,2.097s1.258,.892,2.027,.892H13.318c.769,0,1.508-.325,2.027-.892s.779-1.331,.712-2.097l-.652-7.5Zm-6.406,7.238c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm.75-3c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.75Zm.75-6.75h-3v-1c0-.827,.673-1.5,1.5-1.5s1.5,.673,1.5,1.5v1Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default bagAlert;
