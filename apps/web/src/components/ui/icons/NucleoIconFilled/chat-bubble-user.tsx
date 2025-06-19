import type { iconProps } from './iconProps';

function chatBubbleUser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bubble user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="14.641" cy="10.75" fill="currentColor" r="1.75" />
        <path
          d="M11.841,12.372c-.279-.479-.451-1.029-.451-1.622,0-1.792,1.458-3.25,3.25-3.25,.692,0,1.332,.221,1.859,.592v-3.342c0-1.517-1.233-2.75-2.75-2.75H4.25c-1.517,0-2.75,1.233-2.75,2.75v11.5c0,.288,.165,.551,.425,.676,.103,.05,.214,.074,.325,.074,.167,0,.333-.056,.469-.165l3.544-2.835h4.071c.379-.656,.894-1.21,1.507-1.628Z"
          fill="currentColor"
        />
        <path
          d="M14.641,13c-1.48,0-2.802,.943-3.291,2.345-.131,.375-.07,.795,.162,1.123,.237,.333,.621,.532,1.028,.532h4.202c.407,0,.791-.199,1.027-.532,.232-.328,.293-.748,.163-1.123-.489-1.403-1.811-2.346-3.291-2.346Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chatBubbleUser;
