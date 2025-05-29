import type { iconProps } from './iconProps';

function people3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px people 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9.142,13.418l-1.662-6.026c-.18-.655-.726-1.15-1.39-1.263-.986-.167-2.006-.167-2.992,0-.664,.112-1.21,.608-1.39,1.263L.046,13.417c-.105,.379-.028,.777,.21,1.09s.601,.493,.994,.493h.903l.117,1.395c.074,.9,.84,1.605,1.743,1.605h1.16c.903,0,1.669-.705,1.743-1.604l.117-1.396h.903c.394,0,.756-.18,.994-.493s.315-.71,.21-1.089Z"
          fill="currentColor"
        />
        <path
          d="M17.954,13.418l-1.662-6.026c-.18-.655-.726-1.15-1.39-1.263-.987-.167-2.008-.167-2.991,0-.664,.112-1.21,.608-1.391,1.263l-.742,2.692,.81,2.936c.188,.674,.1,1.372-.215,1.981h.593l.117,1.395c.074,.9,.84,1.605,1.743,1.605h1.16c.903,0,1.669-.705,1.743-1.604l.117-1.396h.903c.394,0,.756-.18,.994-.493s.315-.71,.21-1.089Z"
          fill="currentColor"
        />
        <circle cx="4.594" cy="2.5" fill="currentColor" r="2.5" />
        <circle cx="13.406" cy="2.5" fill="currentColor" r="2.5" />
      </g>
    </svg>
  );
}

export default people3;
