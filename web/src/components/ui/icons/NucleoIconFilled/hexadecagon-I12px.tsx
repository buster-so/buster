import type { iconProps } from './iconProps';

function hexadecagon(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hexadecagon';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.248,7.763l-1.248-1.248v-1.765c0-.965-.785-1.75-1.75-1.75h-1.765l-1.248-1.249c-.682-.681-1.793-.681-2.475,0l-1.248,1.248h-1.765c-.965,0-1.75,.785-1.75,1.75v1.765l-1.248,1.248c-.683,.682-.683,1.792,0,2.475l1.248,1.248v1.765c0,.965,.785,1.75,1.75,1.75h1.765l1.248,1.249c.341,.34,.789,.511,1.237,.511s.896-.17,1.237-.511l1.248-1.248h1.765c.965,0,1.75-.785,1.75-1.75v-1.765l1.248-1.248c.683-.682,.683-1.792,0-2.475Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default hexadecagon;
