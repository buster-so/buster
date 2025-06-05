import type { iconProps } from './iconProps';

function chatBubbleUser2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chat bubble user 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="4.551" cy="8.75" fill="currentColor" r="2.75" />
        <path
          d="M4.551,12.5C2.494,12.5,.68,13.812,.037,15.766c-.075,.229-.036,.479,.105,.674,.141,.195,.367,.31,.607,.31h7.602c.24,0,.467-.115,.607-.31s.181-.445,.105-.674c-.642-1.954-2.455-3.266-4.514-3.266Z"
          fill="currentColor"
        />
        <path
          d="M15.75,0h-5c-1.24,0-2.25,1.009-2.25,2.25v6.5c0,.297,.175,.566,.446,.686,.098,.043,.201,.064,.304,.064,.183,0,.363-.067,.505-.195l2.535-2.305h3.46c1.24,0,2.25-1.009,2.25-2.25V2.25c0-1.241-1.01-2.25-2.25-2.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default chatBubbleUser2;
