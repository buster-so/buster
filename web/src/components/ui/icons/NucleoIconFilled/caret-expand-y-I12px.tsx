import type { iconProps } from './iconProps';

function caretExpandY(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px caret expand y';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.035,2.581c-.466-.688-1.604-.688-2.07,0l-2.348,3.468c-.26,.384-.286,.877-.069,1.287,.217,.41,.641,.664,1.104,.664h4.696c.463,0,.887-.254,1.104-.664,.217-.409,.191-.902-.069-1.287l-2.348-3.468Z"
          fill="currentColor"
        />
        <path
          d="M11.348,10H6.652c-.463,0-.887,.254-1.104,.664-.217,.409-.191,.902,.069,1.287l2.348,3.468c.233,.344,.62,.549,1.035,.549s.802-.206,1.035-.549l2.348-3.468c.26-.384,.286-.877,.069-1.287-.217-.41-.641-.664-1.104-.664Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default caretExpandY;
