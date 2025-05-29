import type { iconProps } from './iconProps';

function hammer2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hammer 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7.835,7.208L2.186,12.857c-.814,.815-.814,2.142,0,2.957,.395,.395,.92,.612,1.479,.612s1.084-.217,1.479-.612l5.649-5.649-2.957-2.957Z"
          fill="currentColor"
        />
        <path
          d="M16.737,6.999L11.987,2.249c-.277-.277-.644-.455-1.033-.5l-4.19-.493c-.228-.03-.456,.052-.618,.214l-.434,.434c-.293,.293-.293,.768,0,1.061l7.53,7.531c.341,.341,.789,.512,1.237,.512s.896-.17,1.237-.512l1.021-1.021c.33-.331,.513-.77,.513-1.238s-.182-.907-.513-1.237Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default hammer2;
