import type { iconProps } from './iconProps';

function arrowPerspDoorOut(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px arrow persp door out';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m10.81.673c-.441-.335-.997-.44-1.528-.293l-2.5.694c-.755.21-1.281.904-1.281,1.687v.99h.75c1.24,0,2.25,1.009,2.25,2.25s-1.01,2.25-2.25,2.25h-.75v.99c0,.783.526,1.476,1.281,1.687l2.501.694c.156.043.314.065.472.065.377,0,.745-.123,1.056-.358.438-.333.69-.841.69-1.393V2.065c0-.551-.252-1.059-.69-1.393Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6.25,5.25h-3.689l1.22-1.22c.293-.293.293-.768,0-1.061s-.768-.293-1.061,0L.22,5.47c-.293.293-.293.768,0,1.061l2.5,2.5c.146.146.338.22.53.22s.384-.073.53-.22c.293-.293.293-.768,0-1.061l-1.22-1.22h3.689c.414,0,.75-.336.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default arrowPerspDoorOut;
