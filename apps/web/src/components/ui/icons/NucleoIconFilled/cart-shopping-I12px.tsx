import type { iconProps } from './iconProps';

function cartShopping(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cart shopping';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.363,4H4.765l-.176-1.196c-.103-.704-.616-1.271-1.307-1.444l-1.351-.337c-.403-.1-.809,.144-.909,.546-.101,.402,.144,.809,.546,.909l1.35,.337c.099,.025,.172,.105,.187,.207l1.032,7.015c-.93,.172-1.637,.985-1.637,1.963,0,1.103,.897,2,2,2H15.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H4.5c-.276,0-.5-.224-.5-.5s.224-.5,.5-.5H13.029c.754,0,1.421-.48,1.66-1.196l1.333-4c.178-.532,.088-1.122-.24-1.577-.328-.455-.859-.727-1.42-.727Z"
          fill="currentColor"
        />
        <circle cx="3.75" cy="15.75" fill="currentColor" r="1.25" />
        <circle cx="14.25" cy="15.75" fill="currentColor" r="1.25" />
      </g>
    </svg>
  );
}

export default cartShopping;
