import type { iconProps } from './iconProps';

function bag(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bag';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.424,5.75H14.576c.522,0,.956,.401,.997,.921l.507,6.421c.092,1.163-.827,2.157-1.994,2.157H3.914c-1.167,0-2.086-.994-1.994-2.157l.507-6.421c.041-.52,.475-.921,.997-.921Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,7.75v-3.25c0-1.519,1.231-2.75,2.75-2.75h0c1.519,0,2.75,1.231,2.75,2.75v3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect height="2" width="4" fill="currentColor" rx=".75" ry=".75" x="7" y="10" />
      </g>
    </svg>
  );
}

export default bag;
