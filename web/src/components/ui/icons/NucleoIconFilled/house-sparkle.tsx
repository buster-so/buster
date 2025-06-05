import type { iconProps } from './iconProps';

function houseSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.31,5.603L10.059,1.612c-.622-.472-1.492-.473-2.118,0L2.69,5.603s0,0,0,0c-.432,.33-.689,.851-.689,1.393v7.254c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V6.996c0-.542-.258-1.063-.69-1.394Zm-2.975,5.318l-1.776,.888-.888,1.776c-.127,.254-.387,.415-.671,.415s-.544-.161-.671-.415l-.888-1.776-1.776-.888c-.255-.127-.415-.387-.415-.671s.16-.544,.415-.671l1.776-.888,.888-1.776c.254-.508,1.088-.508,1.342,0l.888,1.776,1.776,.888c.255,.127,.415,.387,.415,.671s-.16,.544-.415,.671Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default houseSparkle;
