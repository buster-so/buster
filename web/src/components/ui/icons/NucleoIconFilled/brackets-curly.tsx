import type { iconProps } from './iconProps';

function bracketsCurly(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px brackets curly';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m7.75,11.5c-.414,0-.75-.336-.75-.75s.336-.75.75-.75c.689,0,1.25-.561,1.25-1.25v-1.25c0-.576.218-1.102.574-1.5-.356-.398-.574-.924-.574-1.5v-1.25c0-.689-.561-1.25-1.25-1.25-.414,0-.75-.336-.75-.75s.336-.75.75-.75c1.517,0,2.75,1.233,2.75,2.75v1.25c0,.414.337.75.75.75s.75.336.75.75-.336.75-.75.75-.75.336-.75.75v1.25c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m4.25,11.5c-1.517,0-2.75-1.233-2.75-2.75v-1.25c0-.414-.337-.75-.75-.75s-.75-.336-.75-.75.336-.75.75-.75.75-.336.75-.75v-1.25C1.5,1.733,2.733.5,4.25.5c.414,0,.75.336.75.75s-.336.75-.75.75c-.689,0-1.25.561-1.25,1.25v1.25c0,.576-.218,1.102-.574,1.5.356.398.574.924.574,1.5v1.25c0,.689.561,1.25,1.25,1.25.414,0,.75.336.75.75s-.336.75-.75.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default bracketsCurly;
