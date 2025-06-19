import type { iconProps } from './iconProps';

function gem(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gem';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.277,5.61l-2.404-2.556c-.332-.352-.799-.554-1.284-.554H5.411c-.485,0-.953,.202-1.285,.554L1.723,5.61c-.581,.618-.633,1.557-.123,2.234l5.993,7.956c.335,.445,.848,.7,1.407,.7s1.072-.255,1.407-.7l5.993-7.956c.51-.677,.458-1.617-.123-2.234Zm-3.497-1.528l1.804,1.918h-2.187l-1.042-2h1.233c.073,0,.143,.03,.192,.082Zm-1.847,3.418l-1.934,6.405-1.934-6.405h3.867Zm-5.715-3.418c.049-.052,.119-.082,.192-.082h1.233l-1.042,2H3.415l1.804-1.918Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default gem;
