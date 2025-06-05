import type { iconProps } from './iconProps';

function hearts2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px hearts 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M14.517,7.558l.979-1.018c.656-.69,.951-1.697,.681-2.725-.134-.512-.427-.981-.825-1.33-1.49-1.307-3.666-.781-4.464,.863-.127-.262-.294-.503-.495-.715-1.079-1.136-2.874-1.182-4.01-.104-.588,.559-.878,1.309-.877,2.061"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.746,11.79l-4.073,4.232c-.292,.304-.779,.304-1.071,0L2.53,11.79c-1.079-1.136-1.032-2.931,.103-4.01,1.136-1.079,2.931-1.032,4.01,.103,.201,.211,.368,.452,.495,.715,.798-1.644,2.974-2.17,4.464-.863,.398,.349,.69,.819,.825,1.33,.27,1.028-.025,2.035-.681,2.725Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default hearts2;
