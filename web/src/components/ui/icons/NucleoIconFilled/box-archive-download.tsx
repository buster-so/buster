import type { iconProps } from './iconProps';

function boxArchiveDownload(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px box archive download';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.78,8.72c-.293-.293-.768-.293-1.061,0l-.72.72v-3.439c0-.414-.336-.75-.75-.75s-.75.336-.75.75v3.439l-.72-.72c-.293-.293-.768-.293-1.061,0s-.293.768,0,1.061l2,2c.069.069.152.124.244.162.092.038.189.058.287.058s.195-.02.287-.058c.092-.038.175-.093.244-.162l2-2c.293-.293.293-.768,0-1.061Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10.25,0H1.75C.785,0,0,.785,0,1.75v.5c0,.695.411,1.292,1,1.574v4.426c0,1.517,1.233,2.75,2.75,2.75h1.25c.414,0,.75-.336.75-.75s-.336-.75-.75-.75h-1.25c-.689,0-1.25-.561-1.25-1.25v-4.25h7.75c.965,0,1.75-.785,1.75-1.75v-.5c0-.965-.785-1.75-1.75-1.75Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default boxArchiveDownload;
