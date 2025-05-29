import type { iconProps } from './iconProps';

function money(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px money';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="9" fill="currentColor" r="2.5" />
        <path
          d="M14.25,3H3.75c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V5.75c0-1.517-1.233-2.75-2.75-2.75Zm-1.608,10.5H5.358c-.364-1.399-1.459-2.494-2.858-2.858v-3.284c1.399-.364,2.494-1.459,2.858-2.858h7.284c.364,1.399,1.459,2.494,2.858,2.858v3.284c-1.399,.364-2.494,1.459-2.858,2.858Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default money;
