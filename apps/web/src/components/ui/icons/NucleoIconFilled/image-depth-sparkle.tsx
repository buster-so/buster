import type { iconProps } from './iconProps';

function imageDepthSparkle(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px image depth sparkle';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.908,3.008l-1.263-.421-.421-1.263c-.137-.408-.812-.408-.949,0l-.421,1.263-1.263,.421c-.204,.068-.342,.259-.342,.474s.138,.406,.342,.474l1.263,.421,.421,1.263c.068,.204,.26,.342,.475,.342s.406-.138,.475-.342l.421-1.263,1.263-.421c.204-.068,.342-.259,.342-.474s-.138-.406-.342-.474Z"
          fill="currentColor"
        />
        <path
          d="M4.109,11.324l2.687-3.655-.59-.799c-.571-.773-1.841-.773-2.412,0l-2.763,3.738c-.339,.458-.39,1.059-.133,1.567,.256,.508,.77,.824,1.339,.824h1.248c.046-.594,.255-1.174,.625-1.676Z"
          fill="currentColor"
        />
        <path
          d="M15.273,15H6.727c-.664,0-1.262-.368-1.562-.96-.299-.592-.241-1.292,.152-1.826l4.273-5.812c.666-.906,2.153-.906,2.82,0l4.273,5.812c.394,.534,.452,1.234,.152,1.826-.3,.592-.898,.96-1.562,.96ZM10.194,6.846h0Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default imageDepthSparkle;
