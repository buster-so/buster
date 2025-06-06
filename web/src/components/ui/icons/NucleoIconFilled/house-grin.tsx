import type { iconProps } from './iconProps';

function houseGrin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house grin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.31,5.603L10.059,1.612c-.622-.472-1.492-.473-2.118,0L2.69,5.603s0,0,0,0c-.432,.33-.689,.851-.689,1.393v7.254c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V6.996c0-.542-.258-1.063-.69-1.394ZM6.75,10.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Zm2.25,2.5c-.828,0-1.5-.672-1.5-1.5,0-.276,.224-.5,.5-.5h2c.276,0,.5,.224,.5,.5,0,.828-.672,1.5-1.5,1.5Zm2.25-2.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default houseGrin;
