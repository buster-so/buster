import type { iconProps } from './iconProps';

function windowPaintbrush(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px window paintbrush';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,16H3.75c-1.517,0-2.75-1.233-2.75-2.75V4.75c0-1.517,1.233-2.75,2.75-2.75h6.965c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H3.75c-.689,0-1.25,.561-1.25,1.25V13.25c0,.689,.561,1.25,1.25,1.25H14.25c.689,0,1.25-.561,1.25-1.25v-4.966c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v4.966c0,1.517-1.233,2.75-2.75,2.75Z"
          fill="currentColor"
        />
        <path
          d="M17.371,1.635c-.697-.697-1.833-.697-2.53,0l-3.679,3.681c.567,.223,1.09,.557,1.534,1.002,.448,.449,.775,.972,.992,1.529l3.684-3.682c.698-.698,.698-1.833,0-2.53Z"
          fill="currentColor"
        />
        <path
          d="M11.632,7.377c-.563-.565-1.31-.877-2.101-.877h-.006c-.789,.001-1.531,.313-2.09,.879-.795,.804-.933,1.605-1.043,2.25-.12,.698-.186,1.082-1.002,1.528-.265,.145-.417,.436-.386,.736,.032,.301,.241,.553,.53,.64,.862,.259,1.779,.472,2.694,.472,1.182,0,2.359-.355,3.404-1.425,1.155-1.159,1.155-3.044,0-4.203Z"
          fill="currentColor"
        />
        <circle cx="4.25" cy="5.25" fill="currentColor" r=".75" />
        <circle cx="6.75" cy="5.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default windowPaintbrush;
