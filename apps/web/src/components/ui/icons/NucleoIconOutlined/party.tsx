import type { iconProps } from './iconProps';

function party(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px party';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.795,13.957L5.568,4.846c.22-.722,1.13-.95,1.664-.416l6.339,6.339c.534,.534,.306,1.444-.416,1.664l-9.112,2.773c-.765,.233-1.481-.482-1.248-1.248Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.825 14.359L4.654 7.848"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.346 13.287L7.475 4.673"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.743,2.492l-.946-.315-.316-.947c-.102-.306-.609-.306-.711,0l-.316,.947-.946,.315c-.153,.051-.257,.194-.257,.356s.104,.305,.257,.356l.946,.315,.316,.947c.051,.153,.194,.256,.355,.256s.305-.104,.355-.256l.316-.947,.946-.315c.153-.051,.257-.194,.257-.356s-.104-.305-.257-.356Z"
          fill="currentColor"
        />
        <path
          d="M10,3.439c.184-.133,.588-.465,.823-1.048,.307-.763,.118-1.442,.055-1.64"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.561,8c.133-.184,.465-.588,1.048-.823,.763-.307,1.442-.118,1.64-.055"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="12.75" cy="5.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default party;
