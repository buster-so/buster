import type { iconProps } from './iconProps';

function housePin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house pin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.5,13.5c0-2.757,2.243-5,5-5,.526,0,1.023,.104,1.5,.255v-1.759c0-.543-.258-1.064-.691-1.394L10.059,1.613c-.624-.475-1.495-.474-2.118,0L2.691,5.603s0,0,0,0c-.433,.329-.691,.85-.691,1.393v7.254c0,1.517,1.233,2.75,2.75,2.75h6.059c-.721-.912-1.309-2.084-1.309-3.5Z"
          fill="currentColor"
        />
        <path
          d="M14.5,10c-1.93,0-3.5,1.57-3.5,3.5,0,2.655,3.011,4.337,3.139,4.408,.112,.062,.237,.092,.361,.092s.249-.031,.361-.092c.128-.07,3.139-1.753,3.139-4.408,0-1.93-1.57-3.5-3.5-3.5Zm0,4.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default housePin;
