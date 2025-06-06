import type { iconProps } from './iconProps';

function squareUserSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square user sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M11.59,7.16l-1.515-.506-.505-1.515c-.164-.49-.975-.49-1.139,0l-.505,1.515-1.515,.506c-.245,.081-.41,.311-.41,.569s.165,.488,.41,.569l1.515,.506,.505,1.515c.082,.245,.312,.41,.57,.41s.487-.165,.57-.41l.505-1.515,1.515-.506c.245-.081,.41-.311,.41-.569s-.165-.487-.41-.569Z"
          fill="currentColor"
        />
        <path
          d="M4.381,15.213c.12,.022,.243,.037,.369,.037H13.25c.126,0,.249-.015,.369-.037-.003-.051-.006-.101-.019-.15-.54-2.098-2.432-3.563-4.6-3.563s-4.06,1.465-4.6,3.563c-.013,.049-.017,.099-.019,.15Z"
          fill="currentColor"
        />
        <path
          d="M13.25,16H4.75c-1.517,0-2.75-1.233-2.75-2.75V4.75c0-1.517,1.233-2.75,2.75-2.75H13.25c1.517,0,2.75,1.233,2.75,2.75V13.25c0,1.517-1.233,2.75-2.75,2.75ZM4.75,3.5c-.689,0-1.25,.561-1.25,1.25V13.25c0,.689,.561,1.25,1.25,1.25H13.25c.689,0,1.25-.561,1.25-1.25V4.75c0-.689-.561-1.25-1.25-1.25H4.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareUserSparkle;
