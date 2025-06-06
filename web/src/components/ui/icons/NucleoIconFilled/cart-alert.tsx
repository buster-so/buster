import type { iconProps } from './iconProps';

function cartAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cart alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="14.25" cy="15.75" fill="currentColor" r="1.25" />
        <circle cx="3.75" cy="15.75" fill="currentColor" r="1.25" />
        <circle cx="9.75" cy="5.75" fill="currentColor" r=".75" />
        <path
          d="M4.5,11.5H13.029c.754,0,1.421-.48,1.66-1.196l1.333-4c.178-.532,.088-1.122-.24-1.577-.328-.455-.859-.727-1.42-.727h-2.434c-.054,.221-.13,.433-.242,.625,.194,.332,.313,.713,.313,1.125,0,1.241-1.01,2.25-2.25,2.25s-2.25-1.009-2.25-2.25c0-.412,.119-.793,.313-1.125-.112-.192-.189-.404-.242-.625h-2.805l-.176-1.196c-.103-.704-.616-1.271-1.307-1.444l-1.351-.337c-.403-.1-.809,.144-.909,.546-.101,.402,.144,.809,.546,.909l1.35,.337c.099,.025,.172,.105,.187,.207l1.032,7.015c-.93,.172-1.637,.985-1.637,1.963,0,1.103,.897,2,2,2H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.5c-.276,0-.5-.224-.5-.5s.224-.5,.5-.5Z"
          fill="currentColor"
        />
        <path
          d="M9.75,0c-.414,0-.75,.336-.75,.75V3.5c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V.75c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cartAlert;
