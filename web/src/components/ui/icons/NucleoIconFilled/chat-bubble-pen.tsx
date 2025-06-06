import type { iconProps } from './iconProps';

function chatBubblePen(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bubble pen';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.999,13.847c.169-.416,.41-.779,.72-1.085l3.684-3.685c.552-.552,1.297-.855,2.098-.857v-3.47c0-1.517-1.233-2.75-2.75-2.75H4.25c-1.517,0-2.75,1.233-2.75,2.75v11.5c0,.288,.165,.551,.425,.676,.104,.05,.215,.074,.325,.074,.167,0,.333-.056,.469-.165l3.544-2.835h3.675l.062-.153Z"
          fill="currentColor"
        />
        <path
          d="M15.463,10.138l-3.689,3.691c-.164,.162-.293,.356-.383,.578,0,0,0,.001,0,.002l-.63,1.561c-.112,.277-.049,.595,.162,.808,.144,.145,.337,.223,.533,.223,.092,0,.184-.017,.272-.051l1.514-.59c.226-.088,.427-.219,.603-.393l3.723-3.724c.281-.281,.436-.655,.434-1.051-.002-.394-.157-.765-.439-1.048-.564-.562-1.537-.564-2.098-.004Zm-3.378,4.552h0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chatBubblePen;
