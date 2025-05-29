import type { iconProps } from './iconProps';

function material2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px material 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.439,2h-3.689c-1.517,0-2.75,1.233-2.75,2.75v3.689L8.439,2Z"
          fill="currentColor"
        />
        <path
          d="M2,10.561v2.689c0,.485,.137,.935,.358,1.331L14.581,2.358c-.396-.221-.846-.358-1.331-.358h-2.689L2,10.561Z"
          fill="currentColor"
        />
        <path
          d="M16,7.439v-2.689c0-.485-.137-.935-.358-1.331L3.419,15.642c.396,.221,.846,.358,1.331,.358h2.689L16,7.439Z"
          fill="currentColor"
        />
        <path
          d="M9.561,16h3.689c1.517,0,2.75-1.233,2.75-2.75v-3.689l-6.439,6.439Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default material2;
