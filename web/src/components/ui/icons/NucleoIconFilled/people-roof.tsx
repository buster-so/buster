import type { iconProps } from './iconProps';

function peopleRoof(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px people roof';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="5.25" cy="8.25" fill="currentColor" r="2.75" />
        <circle cx="12.75" cy="8.25" fill="currentColor" r="2.75" />
        <path
          d="M5.25,12c-2.28,0-4.242,1.624-4.667,3.86-.042,.219,.017,.446,.159,.618,.143,.172,.354,.271,.578,.271h7.859c.224,0,.435-.1,.578-.271,.143-.172,.201-.399,.159-.618-.424-2.237-2.387-3.86-4.667-3.86Z"
          fill="currentColor"
        />
        <path
          d="M16.25,5c-.109,0-.221-.024-.326-.075L9,1.583,2.076,4.925c-.374,.179-.821,.024-1.001-.349s-.024-.821,.349-1.001L8.674,.075c.206-.1,.446-.1,.652,0l7.25,3.5c.373,.18,.529,.628,.349,1.001-.129,.268-.397,.424-.676,.424Z"
          fill="currentColor"
        />
        <path
          d="M12.75,12c-.977,0-1.886,.312-2.65,.828,.632,.78,1.093,1.712,1.29,2.752,.075,.398,.03,.798-.102,1.169h5.392c.224,0,.435-.1,.578-.271,.143-.172,.201-.399,.159-.618-.424-2.237-2.387-3.86-4.667-3.86Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default peopleRoof;
