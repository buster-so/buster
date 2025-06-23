import type { iconProps } from './iconProps';

function calendarPin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px calendar pin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.75,3.5c-.414,0-.75-.336-.75-.75V.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V2.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M12.25,3.5c-.414,0-.75-.336-.75-.75V.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V2.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.5,10c-1.93,0-3.5,1.57-3.5,3.5,0,2.655,3.011,4.337,3.139,4.408,.112,.062,.237,.092,.361,.092s.249-.031,.361-.092c.128-.07,3.139-1.753,3.139-4.408,0-1.93-1.57-3.5-3.5-3.5Zm0,4.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,2H4.25c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h5.3c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.25c-.689,0-1.25-.561-1.25-1.25V7H15v1.417c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.667c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default calendarPin;
