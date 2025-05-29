import type { iconProps } from './iconProps';

function gasPump(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gas pump';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,15h-.75V4.25c0-1.517-1.233-2.75-2.75-2.75H5.25c-1.517,0-2.75,1.233-2.75,2.75V15h-.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75H13.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75ZM5.25,3h4.5c.689,0,1.25,.561,1.25,1.25v3.75H4v-3.75c0-.689,.561-1.25,1.25-1.25Z"
          fill="currentColor"
        />
        <path
          d="M17.487,5.927l-2.207-2.207c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.03,1.03v1.439c0,.79,.53,1.452,1.25,1.668v2.832c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1c0,1.241,1.009,2.25,2.25,2.25s2.25-1.009,2.25-2.25V7.164c0-.467-.182-.907-.513-1.237Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default gasPump;
