import type { iconProps } from './iconProps';

function roadmap(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px roadmap';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13,9.25V4.75c0-1.517-1.233-2.75-2.75-2.75H4.044c-.596,0-1.145,.298-1.47,.799L.12,6.593c-.16,.248-.16,.567,0,.814l2.455,3.794c.324,.5,.873,.798,1.469,.798h6.206c1.517,0,2.75-1.233,2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M17.88,10.593l-2.482-3.837c-.225-.348-.689-.446-1.037-.223-.348,.225-.447,.689-.223,1.037l2.219,3.43-2.189,3.385c-.047,.072-.126,.115-.211,.115H7.75c-.512,0-.967-.307-1.159-.782-.156-.384-.595-.569-.977-.414-.384,.156-.569,.593-.414,.977,.423,1.044,1.424,1.718,2.55,1.718h6.206c.596,0,1.145-.298,1.47-.799l2.454-3.793c.16-.248,.16-.567,0-.814Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default roadmap;
