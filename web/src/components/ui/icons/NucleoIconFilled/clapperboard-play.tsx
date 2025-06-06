import type { iconProps } from './iconProps';

function clapperboardPlay(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px clapperboard play';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75ZM3.786,6h-1.286v-1.25c0-.689,.561-1.25,1.25-1.25h1.286l-1.25,2.5Zm2.927-2.5h2.073l-1.25,2.5h-2.073l1.25-2.5Zm4.084,8.03l-2.375,1.386c-.409,.239-.922-.056-.922-.53v-2.771c0-.473,.514-.768,.922-.53l2.375,1.386c.406,.237,.406,.823,0,1.06Zm.488-5.53h-2.073l1.25-2.5h2.073l-1.25,2.5Zm4.214,0h-2.536l1.25-2.5h.036c.689,0,1.25,.561,1.25,1.25v1.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default clapperboardPlay;
