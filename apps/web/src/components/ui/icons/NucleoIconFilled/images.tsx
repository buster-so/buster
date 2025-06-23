import type { iconProps } from './iconProps';

function images(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px images';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="5.75" cy="8.25" fill="currentColor" r="1.25" />
        <path
          d="M13.194,8.884c-1.038-1.039-2.851-1.039-3.889,0L3.229,14.961c.3,.179,.647,.289,1.021,.289H13.75c1.105,0,2-.896,2-2v-1.811l-2.556-2.556Z"
          fill="currentColor"
        />
        <path
          d="M13.25,2.5H4.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H13.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,16H4.25c-1.517,0-2.75-1.233-2.75-2.75V6.75c0-1.517,1.233-2.75,2.75-2.75H13.75c1.517,0,2.75,1.233,2.75,2.75v6.5c0,1.517-1.233,2.75-2.75,2.75ZM4.25,5.5c-.689,0-1.25,.561-1.25,1.25v6.5c0,.689,.561,1.25,1.25,1.25H13.75c.689,0,1.25-.561,1.25-1.25V6.75c0-.689-.561-1.25-1.25-1.25H4.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default images;
