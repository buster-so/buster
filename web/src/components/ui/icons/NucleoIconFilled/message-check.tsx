import type { iconProps } from './iconProps';

function messageCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px message check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.099,12.965c.423-.454,1.023-.714,1.645-.714,.472,0,.926,.146,1.305,.417l1.905-2.523c.425-.561,1.096-.894,1.797-.894,.084,0,.166,.011,.249,.02V4.25c0-1.517-1.233-2.75-2.75-2.75H3.75c-1.517,0-2.75,1.233-2.75,2.75v7c0,1.517,1.233,2.75,2.75,2.75h1.25v2.25c0,.288,.165,.551,.425,.676,.103,.05,.214,.074,.325,.074,.167,0,.333-.056,.469-.165l3.3-2.64c.062-.458,.258-.885,.58-1.23Z"
          fill="currentColor"
        />
        <path
          d="M16.151,11.048l-2.896,3.836-1-.932c-.303-.282-.777-.266-1.06,.037-.283,.303-.266,.777,.037,1.06l1.609,1.5c.139,.13,.322,.202,.511,.202,.021,0,.043,0,.065-.003,.212-.019,.406-.125,.534-.295l3.397-4.5c.25-.331,.184-.801-.146-1.051-.331-.249-.801-.183-1.051,.146Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default messageCheck;
