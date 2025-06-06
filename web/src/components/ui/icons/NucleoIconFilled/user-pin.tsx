import type { iconProps } from './iconProps';

function userPin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px user pin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="9" cy="4.5" fill="currentColor" r="3.5" />
        <path
          d="M14.25,9.75c-1.93,0-3.5,1.57-3.5,3.5,0,2.655,3.011,4.337,3.139,4.408,.112,.062,.237,.092,.361,.092s.249-.031,.361-.092c.128-.07,3.139-1.753,3.139-4.408,0-1.93-1.57-3.5-3.5-3.5Zm0,4.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M9.25,13.25c0-1.584,.755-2.981,1.907-3.898-.687-.224-1.411-.352-2.157-.352-2.764,0-5.274,1.636-6.395,4.167-.257,.58-.254,1.245,.008,1.825,.268,.591,.777,1.043,1.399,1.239,1.618,.51,3.296,.769,4.987,.769,.562,0,1.122-.039,1.68-.096-.776-.932-1.43-2.158-1.43-3.654Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default userPin;
