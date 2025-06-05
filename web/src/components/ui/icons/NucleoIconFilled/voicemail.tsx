import type { iconProps } from './iconProps';

function voicemail(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px voicemail';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M18,9c0-2.206-1.794-4-4-4s-4,1.794-4,4c0,.95,.347,1.813,.903,2.5h-3.806c.556-.687,.903-1.55,.903-2.5,0-2.206-1.794-4-4-4S0,6.794,0,9c0,2.034,1.532,3.7,3.499,3.949,.079,.028,.162,.051,.251,.051H14.25c.089,0,.171-.022,.251-.051,1.968-.25,3.499-1.915,3.499-3.949ZM1.5,9c0-1.378,1.121-2.5,2.5-2.5s2.5,1.122,2.5,2.5-1.121,2.5-2.5,2.5-2.5-1.122-2.5-2.5Zm12.5,2.5c-1.379,0-2.5-1.122-2.5-2.5s1.121-2.5,2.5-2.5,2.5,1.122,2.5,2.5-1.121,2.5-2.5,2.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default voicemail;
