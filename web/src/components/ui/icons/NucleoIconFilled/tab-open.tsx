import type { iconProps } from './iconProps';

function tabOpen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px tab open';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.03,3.72l-2.5-2.5c-.293-.293-.768-.293-1.061,0l-2.5,2.5c-.293,.293-.293,.768,0,1.061s.768,.293,1.061,0l1.22-1.22v3.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V3.561l1.22,1.22c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
        <path
          d="M3.75,11.5H14.25c.257,0,.506,.032,.75,.076v-.326c0-1.241-1.009-2.25-2.25-2.25H5.25c-1.241,0-2.25,1.009-2.25,2.25v.326c.244-.044,.493-.076,.75-.076Z"
          fill="currentColor"
        />
        <path
          d="M14.25,13H3.75c-1.517,0-2.75,1.233-2.75,2.75v.5c0,.414,.336,.75,.75,.75h14.5c.414,0,.75-.336,.75-.75v-.5c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tabOpen;
